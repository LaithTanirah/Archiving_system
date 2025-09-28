const { sql, poolPromise } = require("../models/db");
const fs = require("fs");
const path = require("path");

// Create a legal document
const createLegalDocuments = async (req, res) => {
  const {
    incoming_document_number,
    incoming_date,
    court_id,
    case_number,
    camp,
    land_plot,
    basin_number,
    statement,
    outgoing_document_number,
    outgoing_document_date,
    plaintiffs = [],
  } = req.body;

  const images = req.files || [];

  try {
    const pool = await poolPromise;

    // Duplicate check
    const dup = await pool
      .request()
      .input("case_number", sql.NVarChar, case_number)
      .input("court_id", sql.Int, court_id).query(`
        SELECT id FROM legal_documents
        WHERE case_number = @case_number
          AND court_id = @court_id
          AND is_deleted = 0
      `);
    if (dup.recordset.length) {
      return res.status(400).json({
        success: false,
        message: "يوجد مستند بنفس رقم القضية ونفس المحكمة مسبقًا.",
      });
    }

    // Insert main document with OUTPUT INSERTED.id
    const insert = await pool
      .request()
      .input("incoming_document_number", sql.NVarChar, incoming_document_number)
      .input("incoming_date", sql.Date, incoming_date)
      .input("court_id", sql.Int, court_id)
      .input("case_number", sql.NVarChar, case_number)
      .input("camp", sql.NVarChar, camp)
      .input("land_plot", sql.NVarChar, land_plot)
      .input("basin_number", sql.NVarChar, basin_number)
      .input("statement", sql.NVarChar, statement)
      .input("outgoing_document_number", sql.NVarChar, outgoing_document_number)
      .input("outgoing_document_date", sql.Date, outgoing_document_date).query(`
        INSERT INTO legal_documents (
          incoming_document_number, incoming_date, court_id, case_number,
          camp, land_plot, basin_number, statement,
          outgoing_document_number, outgoing_document_date
        )
        OUTPUT INSERTED.id
        VALUES (
          @incoming_document_number, @incoming_date, @court_id, @case_number,
          @camp, @land_plot, @basin_number, @statement,
          @outgoing_document_number, @outgoing_document_date
        )
      `);

    const documentId = insert.recordset[0].id;

    // Insert plaintiffs
    for (const p of plaintiffs) {
      if (p.plaintiff_name) {
        await pool
          .request()
          .input("document_id", sql.Int, documentId)
          .input("plaintiff_name", sql.NVarChar, p.plaintiff_name)
          .input("national_id", sql.NVarChar, p.national_id).query(`
        INSERT INTO plaintiffs
          (document_id, plaintiff_name, national_id)
        VALUES
          (@document_id, @plaintiff_name, @national_id)
      `);
      }
    }

    // Insert images
    for (const f of images) {
      await pool
        .request()
        .input("document_id", sql.Int, documentId)
        .input("image_path", sql.NVarChar, f.path).query(`
          INSERT INTO legal_document_images
            (document_id, image_path)
          VALUES
            (@document_id, @image_path)
        `);
    }

    res.status(201).json({
      success: true,
      message: "تم إنشاء المستند بنجاح",
      documentId,
    });
  } catch (err) {
    console.error("Creation Error:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الخادم",
      error: err.message,
    });
  }
};

// Update legal document by ID
const updateLegalDocumentById = async (req, res) => {
  const documentId = parseInt(req.params.id);
  const newImages = req.files || [];
  let plaintiffs = [];

  try {
    plaintiffs = JSON.parse(req.body.plaintiffs || "[]");
  } catch {}

  let imagesToDelete = req.body.imagesToDelete || [];
  if (typeof imagesToDelete === "string") imagesToDelete = [imagesToDelete];

  const {
    incoming_document_number,
    incoming_date,
    court_id,
    case_number,
    camp,
    land_plot,
    basin_number,
    statement,
    outgoing_document_number,
    outgoing_document_date,
  } = req.body;

  try {
    const pool = await poolPromise;

    // Update document
    await pool
      .request()
      .input("incoming_document_number", sql.NVarChar, incoming_document_number)
      .input("incoming_date", sql.Date, incoming_date)
      .input("court_id", sql.Int, court_id)
      .input("case_number", sql.NVarChar, case_number)
      .input("camp", sql.NVarChar, camp)
      .input("land_plot", sql.NVarChar, land_plot)
      .input("basin_number", sql.NVarChar, basin_number)
      .input("statement", sql.NVarChar, statement)
      .input("outgoing_document_number", sql.NVarChar, outgoing_document_number)
      .input("outgoing_document_date", sql.Date, outgoing_document_date)
      .input("id", sql.Int, documentId).query(`
        UPDATE legal_documents SET
          incoming_document_number = @incoming_document_number,
          incoming_date = @incoming_date,
          court_id = @court_id,
          case_number = @case_number,
          camp = @camp,
          land_plot = @land_plot,
          basin_number = @basin_number,
          statement = @statement,
          outgoing_document_number = @outgoing_document_number,
          outgoing_document_date = @outgoing_document_date
        WHERE id = @id
      `);

    // Delete selected images both from DB and filesystem
    for (const img of imagesToDelete) {
      await pool
        .request()
        .input("document_id", sql.Int, documentId)
        .input("image_path", sql.NVarChar, img).query(`
          DELETE FROM legal_document_images
          WHERE document_id = @document_id
            AND image_path = @image_path
        `);
      fs.unlink(path.join(__dirname, "..", img), (err) => {
        if (err) console.error("Image deletion error:", err.message);
      });
    }

    // Insert new images
    for (const f of newImages) {
      await pool
        .request()
        .input("document_id", sql.Int, documentId)
        .input("image_path", sql.NVarChar, f.path).query(`
          INSERT INTO legal_document_images
            (document_id, image_path)
          VALUES
            (@document_id, @image_path)
        `);
    }

    // Refresh plaintiffs: delete old ones
    await pool
      .request()
      .input("document_id", sql.Int, documentId)
      .query(`DELETE FROM plaintiffs WHERE document_id = @document_id`);

    // Insert new plaintiffs with optional national_id
    // Insert new plaintiffs with optional national_id
    for (const p of plaintiffs) {
      // تأكد من أن هناك اسم مدعي قبل الإضافة
      if (p.plaintiff_name && p.plaintiff_name.trim() !== "") {
        await pool
          .request()
          .input("document_id", sql.Int, documentId)
          .input("plaintiff_name", sql.NVarChar, p.plaintiff_name)
          .input("national_id", sql.NVarChar, p.national_id?.trim() || null)
          .query(`
      INSERT INTO plaintiffs
        (document_id, plaintiff_name, national_id)
      VALUES
        (@document_id, @plaintiff_name, @national_id)
    `);
      }
    }

    res.status(200).json({
      success: true,
      message: "تم تحديث المستند والمدعين والصور بنجاح",
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({
      success: false,
      message: "فشل التحديث",
      error: err.message,
    });
  }
};

// Other helpers...

const getAllLegalDocuments = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ld.*, c.name AS court_name
      FROM legal_documents ld
      LEFT JOIN courts c ON ld.court_id = c.id
      WHERE ld.is_deleted = 0
    `);

    res.status(200).json({
      success: true,
      message: "All legal documents",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const getLegalDocumentById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const pool = await poolPromise;

    const doc = await pool.request().input("id", sql.Int, id).query(`
        SELECT ld.*, c.name AS court_name
        FROM legal_documents ld
        LEFT JOIN courts c ON ld.court_id = c.id
        WHERE ld.id = @id
      `);

    if (!doc.recordset.length) {
      return res
        .status(404)
        .json({ success: false, message: `لم يتم العثور على المستند ${id}` });
    }
    if (doc.recordset[0].is_deleted) {
      return res
        .status(410)
        .json({ success: false, message: `المستند ${id} تم حذفه` });
    }

    const images = await pool
      .request()
      .input("document_id", sql.Int, id)
      .query(
        `SELECT image_path FROM legal_document_images WHERE document_id = @document_id`
      );

    const plaintiffs = await pool
      .request()
      .input("document_id", sql.Int, id)
      .query(
        `SELECT plaintiff_name, national_id FROM plaintiffs WHERE document_id = @document_id`
      );

    res.status(200).json({
      success: true,
      message: `تم جلب المستند ${id}`,
      legal_document: {
        ...doc.recordset[0],
        images: images.recordset.map((r) => r.image_path),
        plaintiffs: plaintiffs.recordset,
      },
    });
  } catch (err) {
    console.error("Detail Error:", err);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم",
      error: err.message,
    });
  }
};

const deleteLegalDocumentById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`UPDATE legal_documents SET is_deleted = 1 WHERE id = @id`);

    res.status(200).json({
      success: true,
      message: `تم حذف المستند بالمعرف ${id} بنجاح`,
    });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء الحذف",
      error: err.message,
    });
  }
};

const searchLegalDocuments = async (req, res) => {
  try {
    const q = req.params.q;
    const pool = await poolPromise;

    let query = `
      SELECT 
        ld.*, 
        c.name AS court_name,
        p.id AS plaintiff_id,
        p.plaintiff_name,
        p.national_id
      FROM legal_documents ld
      LEFT JOIN courts c ON ld.court_id = c.id
      LEFT JOIN plaintiffs p ON ld.id = p.document_id
      WHERE ld.is_deleted = 0
    `;

    const reqDb = pool.request();

    if (q) {
      query += `
        AND (
          ld.incoming_document_number LIKE @q OR
          CONVERT(NVARCHAR, ld.incoming_date, 120) LIKE @q OR
          ld.case_number LIKE @q OR
          ld.camp LIKE @q OR
          ld.land_plot LIKE @q OR
          ld.basin_number LIKE @q OR
          ld.statement LIKE @q OR
          ld.outgoing_document_number LIKE @q OR
          CONVERT(NVARCHAR, ld.outgoing_document_date, 120) LIKE @q OR
          c.name LIKE @q OR
          p.plaintiff_name LIKE @q OR
          p.national_id LIKE @q
        )
      `;
      reqDb.input("q", sql.NVarChar, `%${q}%`);
    }

    const result = await reqDb.query(query);

    // تجميع النتائج حسب المستند
    const documentsMap = new Map();

    for (const row of result.recordset) {
      const docId = row.id;

      if (!documentsMap.has(docId)) {
        documentsMap.set(docId, {
          id: row.id,
          incoming_document_number: row.incoming_document_number,
          incoming_date: row.incoming_date,
          case_number: row.case_number,
          camp: row.camp,
          land_plot: row.land_plot,
          basin_number: row.basin_number,
          statement: row.statement,
          outgoing_document_number: row.outgoing_document_number,
          outgoing_document_date: row.outgoing_document_date,
          is_deleted: row.is_deleted,
          court_id: row.court_id,
          court_name: row.court_name,
          plaintiffs: [],
        });
      }

      if (row.plaintiff_id) {
        documentsMap.get(docId).plaintiffs.push({
          id: row.plaintiff_id,
          plaintiff_name: row.plaintiff_name,
          national_id: row.national_id,
        });
      }
    }

    const documents = Array.from(documentsMap.values());

    res.status(200).json({
      success: true,
      message: "نتائج البحث",
      data: documents,
    });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث",
      error: err.message,
    });
  }
};

const bulkUploadLegalDocuments = async (req, res) => {
  try {
    const pool = await poolPromise;
    const documents = JSON.parse(req.body.documents || "[]");
    if (!Array.isArray(documents) || !documents.length) {
      return res.status(400).json({
        success: false,
        message: "البيانات المدخلة غير صالحة أو فارغة",
      });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      for (const doc of documents) {
        const {
          incoming_document_number,
          incoming_date,
          court_id,
          case_number,
          camp,
          land_plot,
          basin_number,
          statement,
          outgoing_document_number,
          outgoing_document_date,
          plaintiffs = [],
        } = doc;

        const reqTrans = transaction.request();
        reqTrans.input(
          "incoming_document_number",
          sql.NVarChar,
          incoming_document_number
        );
        reqTrans.input("incoming_date", sql.Date, incoming_date);
        reqTrans.input("court_id", sql.Int, court_id);
        reqTrans.input("case_number", sql.NVarChar, case_number);
        reqTrans.input("camp", sql.NVarChar, camp);
        reqTrans.input("land_plot", sql.NVarChar, land_plot);
        reqTrans.input("basin_number", sql.NVarChar, basin_number);
        reqTrans.input("statement", sql.NVarChar, statement);
        reqTrans.input(
          "outgoing_document_number",
          sql.NVarChar,
          outgoing_document_number
        );
        reqTrans.input(
          "outgoing_document_date",
          sql.Date,
          outgoing_document_date
        );

        const insRes = await reqTrans.query(`
          INSERT INTO legal_documents (
            incoming_document_number, incoming_date, court_id, case_number,
            camp, land_plot, basin_number, statement,
            outgoing_document_number, outgoing_document_date
          )
          OUTPUT INSERTED.id
          VALUES (
            @incoming_document_number, @incoming_date, @court_id, @case_number,
            @camp, @land_plot, @basin_number, @statement,
            @outgoing_document_number, @outgoing_document_date
          )
        `);

        const docId = insRes.recordset[0].id;
        for (const p of plaintiffs) {
          if (p.plaintiff_name && p.national_id) {
            const reqPla = transaction.request();
            reqPla.input("document_id", sql.Int, docId);
            reqPla.input("plaintiff_name", sql.NVarChar, p.plaintiff_name);
            reqPla.input("national_id", sql.NVarChar, p.national_id);
            await reqPla.query(`
              INSERT INTO plaintiffs (document_id, plaintiff_name, national_id)
              VALUES (@document_id, @plaintiff_name, @national_id)
            `);
          }
        }
      }
      await transaction.commit();
      res.status(201).json({
        success: true,
        message: "تم رفع المستندات بنجاح",
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Bulk Upload Error:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء رفع المستندات",
      error: err.message,
    });
  }
};

module.exports = {
  createLegalDocuments,
  updateLegalDocumentById,
  getAllLegalDocuments,
  getLegalDocumentById,
  deleteLegalDocumentById,
  searchLegalDocuments,
  bulkUploadLegalDocuments,
};
