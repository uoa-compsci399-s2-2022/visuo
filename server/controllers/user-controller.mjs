import User from "../models/user.js";
import Test from "../models/test.js"
import APIError from "../handlers/APIError.js";
// import bcrypt from "bcrypt";

const createStudent = async (req, res, next) => {

  if (!req.body.name) {
    return next(new APIError("Name not provided.", 400));
  }

  //Check if there is a test with test code
  const testExists = await Test.findOne({code: req.body.permissions}).exec();
  if (!testExists) {
    return next(new APIError("Invalid test code", 400));
  }

  //Check if test is published
  if (!testExists.published){
    return next(new APIError("Cannot do unpublished test", 400));
  }

  // Prevent creating admin user
  if (req.body.permissions.includes("admin")) {
    return next(new APIError("Forbidden.", 403));
  }

  // Prevent creating same name as an admin
  let exists = await User.findOne({
    name: req.body.name,
    permissions: "admin",
  }).exec();
  if (exists) {
    return next(new APIError("Cannot use this name, choose another one", 400));
  }

  // Check if user already exists
  exists = await User.findOne({
    name: req.body.name,
    permissions: req.body.permissions,
  }).exec();
  if (exists) {
    return next(new APIError("You have already done this test.", 400));
  }

  const createdStudent = new User({
    name: req.body.name,
    permissions: req.body.permissions,
  });

  try {
    await createdStudent.validate();
  } catch (e) {
    return next(new APIError("Invalid or missing inputs.", 400));
  }

  let result;
  try {
    result = await createdStudent.save();
  } catch (e) {
    return next(new APIError("Could not save user.", 500));
  }

  res.status(201).json({message: "Successfully created user."});
};

export { createStudent };
