const jwt = require("jsonwebtoken");

// دالة التحقق من تسجيل دخول المستخدم
const authentication = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({
        success: false,
        message: "ممنوع الوصول بدون توكن",
      });
    }

    const token = authHeader.split(" ").pop();
    if (!token) {
      return res.status(403).json({
        success: false,
        message: "التوكن مفقود",
      });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "التوكن غير صالح أو منتهي الصلاحية",
        });
      }
      req.token = decoded; // تخزين بيانات التوكن في الطلب
      next();
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم",
      err: err.message,
    });
  }
};

module.exports = authentication;
