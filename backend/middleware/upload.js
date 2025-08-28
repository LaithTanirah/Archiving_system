const multer = require("multer");
const path = require("path");
const fs = require("fs");

// التأكد من وجود مجلد uploads
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// تحديد مكان حفظ الملفات وطريقة التسمية
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// فلتر لقبول ملفات PDF فقط
const fileFilter = (req, file, cb) => {
  const isPdf =
    path.extname(file.originalname).toLowerCase() === ".pdf" &&
    file.mimetype === "application/pdf";

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error("يُسمح فقط برفع ملفات PDF"));
  }
};

// تهيئة multer مع حجم أكبر (50 ميجا) وقبول عدة ملفات بدون حد أعلى
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 ميجا لكل ملف
});

module.exports = upload;
