const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (e) {
    return next(new HttpError("Something went wrong", 500));
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (e) {
    return next(new HttpError("Signup failed. Please try again later"), 500);
  }

  if (existingUser) {
    return next(
      new HttpError("user already exists, please login instead"),
      422
    );
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (e) {
    return next(new HttpError("Something went wrong", 500));
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });
  try {
    await newUser.save();
  } catch (e) {
    return next(new HttpError("Signup failed. Please try again later"), 500);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (e) {
    return next(new HttpError("Something went wrong", 500));
  }

  res.status(201).json({ userId: newUser.id, email: newUser.email, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (e) {
    return next(new HttpError("Logging in failed. Please try again."), 500);
  }

  if (!existingUser) {
    return next(new HttpError("Invalid credentials"), 401);
  }

  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(password, existingUser.password);
  } catch (e) {
    return next(new HttpError("Something went wrong", 500));
  }

  if (!isMatch) {
    return next(new HttpError("Invalid credentials"), 401);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (e) {
    return next(new HttpError("Something went wrong", 500));
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token });
};

module.exports = {
  login,
  signup,
  getUsers,
};
