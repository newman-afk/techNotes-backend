const User = require("../models/User");
const Note = require("../models/Note");
const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { response } = require("express");

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").lean();
  if (!users?.length) {
    return res.status(404).json("No users found");
  } else {
    return res.status(200).json(users);
  }
});

const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPassword }
      : { username, password: hashedPassword, roles };

  const user = await User.create(userObject);
  if (!user) {
    return res.status(404).json({ message: "Invalid user data received" });
  } else {
    return res
      .status(201)
      .json({ message: `New user ${user.username} created` });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  console.log(req.body);

  const { id, active, username, password, roles } = req.body;
  if (
    !id ||
    !username ||
    !typeof active === "boolean" ||
    !Array.isArray(roles) ||
    roles.length === 0
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate && duplicate._id.toString() !== user._id.toString()) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  }
  user.username = username;
  user.active = active;
  user.roles = roles;
  const updatedUser = await user.save();
  if (!updatedUser) {
    return res.status(404).json({ message: "Invalid user data received" });
  } else {
    return res.status(200).json({ message: `User ${user.username} updated` });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "User ID are required" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has notes" });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const deletedUser = await user.deleteOne();

  res.json({ message: `User ${user.username} deleted` });
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
