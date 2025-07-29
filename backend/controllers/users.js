const { sql, poolPromise } = require("../models/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register new user
const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get a connection from the pool
    const pool = await poolPromise;

    // Check if the email already exists
    const emailCheck = await pool
      .request()
      .input("email", sql.VarChar, email.toLowerCase())
      .query("SELECT * FROM users WHERE email = @email");

    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "The email already exists",
      });
    }

    // Insert the new user
    await pool
      .request()
      .input("firstName", sql.VarChar, firstName)
      .input("lastName", sql.VarChar, lastName)
      .input("email", sql.VarChar, email.toLowerCase())
      .input("password", sql.VarChar, hashedPassword)
      .query(
        `INSERT INTO users (firstName, lastName, email, password)
         VALUES (@firstName, @lastName, @email, @password)`
      );

    // Return success
    res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.VarChar, email.toLowerCase())
      .query("SELECT * FROM users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        message:
          "The email doesn’t exist or the password you’ve entered is incorrect",
      });
    }

    const user = result.recordset[0];
    const passwordCompare = await bcrypt.compare(password, user.password);

    if (!passwordCompare) {
      return res.status(403).json({
        success: false,
        message:
          "The email doesn’t exist or the password you’ve entered is incorrect",
      });
    }

    const payload = {
      userId: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
    };

    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "60m" });

    res.status(200).json({
      success: true,
      message: "Valid login credentials",
      token,
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      err: err.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM users");

    res.status(200).json({
      success: true,
      message: "All Users",
      users: result.recordset,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      err: err.message,
    });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM users WHERE id = @id");

    res.status(200).json({
      success: true,
      message: `User with ID ${id} deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error while deleting user",
      err: err.message,
    });
  }
};

// Update user by ID
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password } = req.body;

  try {
    const pool = await poolPromise;

    // Optional password hashing
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const query = `
      UPDATE users
      SET 
        firstName = @firstName,
        lastName = @lastName,
        email = @email
        ${password ? ", password = @password" : ""}
      WHERE id = @id
    `;

    const request = pool
      .request()
      .input("id", sql.Int, id)
      .input("firstName", sql.VarChar, firstName)
      .input("lastName", sql.VarChar, lastName)
      .input("email", sql.VarChar, email.toLowerCase());

    if (password) {
      request.input("password", sql.VarChar, hashedPassword);
    }

    await request.query(query);

    res.status(200).json({
      success: true,
      message: `User with ID ${id} updated successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error while updating user",
      err: err.message,
    });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
  deleteUser,
  updateUser,
};
