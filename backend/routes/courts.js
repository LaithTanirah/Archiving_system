const express = require("express");
const router = express.Router();
const {
  createcourt,
  getAllcourts,
  deleteCourt,
  getCourtById,
} = require("../controllers/courts");

// إضافة محكمة جديدة
router.post("/", createcourt);

// جلب كل المحاكم
router.get("/", getAllcourts);

// جلب محكمة حسب المعرف
router.get("/:id", getCourtById);

// حذف محكمة حسب المعرف
router.delete("/:id", deleteCourt);

module.exports = router;
