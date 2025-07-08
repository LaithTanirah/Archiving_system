const pool = require("../models/db");

// This function creates (new user)
const createcourt = async (req, res) => {
  //TODO: write your code here

  const { name } = req.body;

  const query = "INSERT INTO courts (name) VALUES ($1)";
  pool
    .query(query, [name])
    .then((result) => {
      res.status(201).json({
        success: true,
        message: `court created successfully`,
        court: result.rows,
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

const getAllcourts = (req, res) => {
  const query = "SELECT * FROM courts";
  pool
    .query(query)
    .then((result) => {
      res.status(200).json({
        success: true,
        message: `all of courts`,
        court: result.rows,
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
const deleteCourt = (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM courts WHERE id = $1";
  pool
    .query(query, [id])
    .then(() => {
      res.status(200).json({
        success: true,
        message: `تم حذف المحكمة بالمعرف ${id} بنجاح`,
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: `حدث خطأ أثناء الحذف`,
        err: err.message,
      });
    });
};

const getCourtById = (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM courts WHERE id = $1";
  pool
    .query(query, [id])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `لم يتم العثور على المحكمة بالمعرف: ${id}`,
        });
      }
      res.status(200).json({
        success: true,
        message: `تم جلب المحكمة بالمعرف ${id}`,
        court: result.rows[0],
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: "حدث خطأ في الخادم",
        err: err.message,
      });
    });
};

module.exports = { createcourt, getAllcourts, deleteCourt, getCourtById };
