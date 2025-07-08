const multer = require("multer");
const path = require("path");

// تحديد مكان الحفظ وكيفية تسمية الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // تأكد من وجود المجلد "uploads" في المشروع
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // مثال: 1689231231-file.pdf
  },
});

// فلتر لقبول فقط ملفات PDF
const fileFilter = (req, file, cb) => {
  const isPdf = path.extname(file.originalname).toLowerCase() === ".pdf" &&
                file.mimetype === "application/pdf";

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error("يُسمح فقط برفع ملفات PDF"));
  }
};

// الإعداد النهائي للـ multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // حد أقصى للملف: 10MB
});

module.exports = upload;
