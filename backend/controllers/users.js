const pool = require("../models/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// This function creates (new user)
const register = async (req, res) => {
  //TODO: write your code here

  const { firstName, lastName, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const secPass = await bcrypt.hash(password, salt);
  const query =
    "INSERT INTO users (firstName, lastName, email, password) VALUES ($1,$2,$3,$4)";
  pool
    .query(query, [firstName, lastName, email.toLowerCase(), secPass])
    .then((result) => {
      res.status(201).json({
        success: true,
        message: `Account created successfully`,
      });
    })
    .catch((err) => {
      console.log(err);
      if (err.routine == "_bt_check_unique") {
        return res.status(409).json({
          success: false,
          message: `The email already exists`,
        });
      }
      res.status(500).json({
        success: false,
        message: `Server Error`,
        err: err.message,
      });
    });
};

const login = (req, res) => {
  console.log("Body received:", req.body);
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = $1";
  pool
    .query(query, [email.toLowerCase()])
    .then(async (result) => {
      // إذا ما في نتيجة، يعني المستخدم مش موجود
      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message:
            "The email doesn’t exist or the password you’ve entered is incorrect",
        });
      }

      // إذا كان فيه مستخدم، نكمل بمقارنة كلمة المرور
      const passwordCompare = await bcrypt.compare(
        password,
        result.rows[0].password
      );
      if (!passwordCompare) {
        return res.status(403).json({
          success: false,
          message:
            "The email doesn’t exist or the password you’ve entered is incorrect",
        });
      } else {
        const payload = {
          userId: result.rows[0].id,
          firstname: result.rows[0].firstname,
          lastname: result.rows[0].lastname,
        };

        const options = {
          expiresIn: "60m",
        };
        const token = jwt.sign(payload, process.env.SECRET, options);
        return res.status(200).json({
          success: true,
          message: "Valid login credentials",
          token: token,
          userId: result.rows[0].id,
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Server Error",
        err: err.message,
      });
    });
};

const getAllUsers = (req, res) => {
  const query = "SELECT * FROM users";
  pool
    .query(query)
    .then((result) => {
      return res.status(200).json({
        success: true,
        massage: "All Users",
        users: result.rows,
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

const deleteUser = (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM users WHERE id = $1";
  pool
    .query(query, [id])
    .then(() => {
      res.status(200).json({
        success: true,
        message: `تم حذف المستخدم بالمعرف ${id} بنجاح`,
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

module.exports = { register, login, getAllUsers, deleteUser };
