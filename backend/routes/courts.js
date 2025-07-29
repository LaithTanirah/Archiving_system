const express = require("express");
const router = express.Router();
const {
  createCourt,
  getAllCourts,
  getCourtById,
  deleteCourt,
  updateCourt,
} = require("../controllers/courts");

// إضافة محكمة جديدة
router.post("/", createCourt);

// جلب كل المحاكم
router.get("/", getAllCourts);

// جلب محكمة حسب المعرف
router.get("/:id", getCourtById);

// حذف محكمة حسب المعرف
router.delete("/:id", deleteCourt);

module.exports = router;
