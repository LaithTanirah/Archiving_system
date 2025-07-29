const { sql, poolPromise } = require("../models/db");

// إنشاء محكمة جديدة مع التحقق من الاسم المكرر
const createCourt = async (req, res) => {
  const { name } = req.body;
  console.log(name);

  try {
    const pool = await poolPromise;

    // تحقق هل الاسم موجود مسبقاً
    const existing = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .query("SELECT * FROM courts WHERE name = @name");

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "اسم المحكمة موجود مسبقاً، الرجاء اختيار اسم آخر.",
      });
    }

    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .query("INSERT INTO courts (name) VALUES (@name)");

    res.status(201).json({
      success: true,
      message: "Court created successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      err: err.message,
    });
  }
};

// جلب كل المحاكم
const getAllCourts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM courts");
    res.status(200).json({
      success: true,
      message: "All courts retrieved",
      courts: result.recordset,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      err: err.message,
    });
  }
};

// جلب محكمة حسب المعرف
const getCourtById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM courts WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Court with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Court with ID ${id} retrieved`,
      court: result.recordset[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      err: err.message,
    });
  }
};

// حذف محكمة حسب المعرف
const deleteCourt = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM courts WHERE id = @id");

    res.status(200).json({
      success: true,
      message: `Court with ID ${id} deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error while deleting court",
      err: err.message,
    });
  }
};

// تحديث محكمة حسب المعرف مع التحقق من الاسم المكرر
const updateCourt = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const pool = await poolPromise;

    // تحقق إن المحكمة موجودة
    const check = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM courts WHERE id = @id");

    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Court with ID ${id} not found`,
      });
    }

    // تحقق من تكرار الاسم (باستثناء المحكمة ذات نفس الـ id)
    const nameCheck = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("id", sql.Int, id)
      .query("SELECT * FROM courts WHERE name = @name AND id != @id");

    if (nameCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "اسم المحكمة موجود مسبقاً لمحكمة أخرى، الرجاء اختيار اسم آخر.",
      });
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .query("UPDATE courts SET name = @name WHERE id = @id");

    res.status(200).json({
      success: true,
      message: `Court with ID ${id} updated successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error while updating court",
      err: err.message,
    });
  }
};

module.exports = {
  createCourt,
  getAllCourts,
  getCourtById,
  deleteCourt,
  updateCourt,
};
