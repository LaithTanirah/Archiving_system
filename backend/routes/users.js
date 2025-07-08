const express = require("express");
const userRouter = express.Router();
// Import users controllers
const {
  register,
  login,
  getAllUsers,
  deleteUser,
} = require("../controllers/users");

module.exports = userRouter;

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/", getAllUsers);
userRouter.delete("/:id", deleteUser);
