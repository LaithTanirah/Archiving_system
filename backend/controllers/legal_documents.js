const pool = require("../models/db");
const fs = require("fs");
const path = require("path");
// إنشاء مستند قانوني
const createLegalDocuments = async (req, res) => {
  try {
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
      plaintiffs = [], // مصفوفة من المدعين
    } = req.body;
    console.log(req.body);

    const images = req.files || [];

    // التحقق من التكرار
    const checkDuplicate = await pool.query(
      `SELECT id FROM legal_documents WHERE case_number = $1 AND court_id = $2 AND is_deleted = 0`,
      [case_number, court_id]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "يوجد مستند بنفس رقم القضية ونفس المحكمة مسبقًا.",
      });
    }

    const insertQuery = `
      INSERT INTO legal_documents (
        incoming_document_number,
        incoming_date,
        court_id,
        case_number,
        camp,
        land_plot,
        basin_number,
        statement,
        outgoing_document_number,
        outgoing_document_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id;
    `;

    const insertResult = await pool.query(insertQuery, [
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
    ]);

    const documentId = insertResult.rows[0].id;

    // إدخال المدعين
    for (const p of plaintiffs) {
      await pool.query(
        `INSERT INTO plaintiffs (document_id, plaintiff_name, national_id) VALUES ($1, $2, $3)`,
        [documentId, p.plaintiff_name, p.national_id]
      );
    }

    // إدخال الصور
    for (const file of images) {
      const imagePath = file.path;
      await pool.query(
        `INSERT INTO legal_document_images (document_id, image_path) VALUES ($1, $2)`,
        [documentId, imagePath]
      );
    }

    res.status(201).json({
      success: true,
      message: "تم إنشاء المستند بنجاح",
      documentId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الخادم",
      error: err.message,
    });
  }
};

const updateLegalDocumentById = async (req, res) => {
  const documentId = req.params.id;
  const newImages = req.files || [];

  try {
    const plaintiffs = JSON.parse(req.body.plaintiffs || "[]");

    let imagesToDelete = req.body.imagesToDelete || [];
    if (typeof imagesToDelete === "string") {
      imagesToDelete = [imagesToDelete];
    }

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

    // تحديث بيانات المستند
    await pool.query(
      `UPDATE legal_documents SET 
        incoming_document_number = $1,
        incoming_date = $2,
        court_id = $3,
        case_number = $4,
        camp = $5,
        land_plot = $6,
        basin_number = $7,
        statement = $8,
        outgoing_document_number = $9,
        outgoing_document_date = $10
      WHERE id = $11`,
      [
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
        documentId,
      ]
    );

    // حذف الصور المحددة من قاعدة البيانات والنظام
    for (const imgPath of imagesToDelete) {
      await pool.query(
        "DELETE FROM legal_document_images WHERE document_id = $1 AND image_path = $2",
        [documentId, imgPath]
      );

      const fullPath = path.join(__dirname, "..", imgPath);
      fs.unlink(fullPath, (err) => {
        if (err) console.error(`خطأ في حذف الصورة ${imgPath}:`, err.message);
      });
    }

    // إضافة الصور الجديدة
    for (const file of newImages) {
      await pool.query(
        "INSERT INTO legal_document_images (document_id, image_path) VALUES ($1, $2)",
        [documentId, file.path]
      );
    }

    // حذف المدعين السابقين
    await pool.query("DELETE FROM plaintiffs WHERE document_id = $1", [
      documentId,
    ]);

    // إضافة المدعين الجدد
    for (const p of plaintiffs) {
      if (p.plaintiff_name && p.national_id) {
        await pool.query(
          `INSERT INTO plaintiffs (document_id, plaintiff_name, national_id) VALUES ($1, $2, $3)`,
          [documentId, p.plaintiff_name, p.national_id]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `تم تحديث المستند والمدعين والصور بنجاح`,
    });
  } catch (err) {
    console.error("خطأ أثناء التحديث:", err);
    res.status(500).json({
      success: false,
      message: `فشل التحديث`,
      error: err.message,
    });
  }
};

// جلب كل المستندات مع اسم المحكمة
const getAllLegalDocuments = (req, res) => {
  const query = `
    SELECT ld.*, c.name AS court_name
    FROM legal_documents ld
    LEFT JOIN courts c ON ld.court_id = c.id
    WHERE ld.is_deleted = 0
  `;
  pool
    .query(query)
    .then((result) => {
      res.status(200).json({
        success: true,
        message: `All legal_documents`,
        data: result.rows,
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: `Server Error`,
        err: err.message,
      });
    });
};

// جلب مستند حسب المعرف مع الصور والمدعين
const getLegalDocumentById = async (req, res) => {
  const id = req.params.id;

  try {
    const docResult = await pool.query(
      `SELECT ld.*, c.name AS court_name
       FROM legal_documents ld
       LEFT JOIN courts c ON ld.court_id = c.id
       WHERE ld.id = $1;`,
      [id]
    );

    const document = docResult.rows[0];

    if (!document) {
      return res.status(404).json({
        success: false,
        message: `لم يتم العثور على المستند بالمعرف: ${id}`,
      });
    }

    if (document.is_deleted) {
      return res.status(410).json({
        success: false,
        message: `المستند بالمعرف ${id} تم حذفه`,
      });
    }

    const imagesResult = await pool.query(
      "SELECT image_path FROM legal_document_images WHERE document_id = $1;",
      [id]
    );
    const images = imagesResult.rows.map((row) => row.image_path);

    const plaintiffsResult = await pool.query(
      "SELECT plaintiff_name, national_id FROM plaintiffs WHERE document_id = $1;",
      [id]
    );

    res.status(200).json({
      success: true,
      message: `تم جلب المستند بالمعرف ${id}`,
      legal_document: {
        ...document,
        images,
        plaintiffs: plaintiffsResult.rows,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم",
      error: err.message,
    });
  }
};

// البحث مع ضم المدعين
const searchLegalDocuments = async (req, res) => {
  try {
    const { q } = req.params;
    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "يرجى إدخال كلمة للبحث",
      });
    }

    const values = [`%${q}%`];

    const query = `
      SELECT ld.*, c.name AS court_name,
        COALESCE(
          json_agg(
            json_build_object(
              'plaintiff_name', p.plaintiff_name,
              'national_id', p.national_id
            )
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS plaintiffs
      FROM legal_documents ld
      LEFT JOIN courts c ON ld.court_id = c.id
      LEFT JOIN plaintiffs p ON p.document_id = ld.id
      WHERE ld.is_deleted = 0 AND (
        incoming_document_number ILIKE $1 OR
        incoming_date::text ILIKE $1 OR
        camp ILIKE $1 OR
        case_number ILIKE $1 OR
        land_plot ILIKE $1 OR
        basin_number ILIKE $1 OR
        statement ILIKE $1 OR
        outgoing_document_number ILIKE $1 OR
        outgoing_document_date::text ILIKE $1 OR
        c.name ILIKE $1 OR
        p.plaintiff_name ILIKE $1 OR
        p.national_id ILIKE $1
      )
      GROUP BY ld.id, c.name
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: `نتائج البحث عن "${q}"`,
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث",
      error: err.message,
    });
  }
};

// رفع دفعات مع منع التكرار وإضافة المدعين
const bulkUploadLegalDocuments = async (req, res) => {
  const { documents } = req.body;

  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({
      success: false,
      message: "يرجى إرسال بيانات صالحة للرفع",
    });
  }

  try {
    await pool.query("BEGIN");

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

      const duplicateCheck = await pool.query(
        `SELECT id FROM legal_documents WHERE case_number = $1 AND court_id = $2 AND is_deleted = 0`,
        [case_number, court_id]
      );

      if (duplicateCheck.rows.length > 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `يوجد مستند مكرر: رقم القضية (${case_number}) في المحكمة المحددة.`,
        });
      }

      const insertDoc = await pool.query(
        `INSERT INTO legal_documents (
          incoming_document_number,
          incoming_date,
          court_id,
          case_number,
          camp,
          land_plot,
          basin_number,
          statement,
          outgoing_document_number,
          outgoing_document_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          incoming_document_number || null,
          incoming_date || null,
          court_id || null,
          case_number || null,
          camp || null,
          land_plot || null,
          basin_number || null,
          statement || null,
          outgoing_document_number || null,
          outgoing_document_date || null,
        ]
      );

      const documentId = insertDoc.rows[0].id;

      for (const pl of plaintiffs) {
        await pool.query(
          `INSERT INTO plaintiffs(document_id, plaintiff_name, national_id) VALUES($1,$2,$3)`,
          [documentId, pl.plaintiff_name, pl.national_id]
        );
      }
    }

    await pool.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "تم رفع البيانات دفعة واحدة بنجاح",
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء رفع البيانات دفعة واحدة",
      error: err.message,
    });
  }
};

// حذف مستند (تحديث is_deleted إلى 1)
const deleteLegalDocumentById = (req, res) => {
  const query = "UPDATE legal_documents SET is_deleted = $1 WHERE id = $2";
  pool
    .query(query, [1, req.params.id])
    .then(() => {
      res.status(201).json({
        success: true,
        message: `تم حذف المستند بنجاح`,
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: `Server Error`,
        err: err.message,
      });
    });
};

// تصدير الوظائف
module.exports = {
  createLegalDocuments,
  getAllLegalDocuments,
  getLegalDocumentById,
  updateLegalDocumentById,
  deleteLegalDocumentById,
  searchLegalDocuments,
  bulkUploadLegalDocuments,
};
