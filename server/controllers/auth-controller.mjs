import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

import User from "../models/user.js";
import APIError from "../handlers/APIError.js";

// GLOBAL VARS
const accessTokenTime = "30m";
const refreshTokenTime = "1h";

// HELPER FUNCTIONS
const createTokens = async (res, name, permissions) => {
  const accessToken = jwt.sign(
    {
      UserInfo: {
        name: name,
        permissions: permissions,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: accessTokenTime } // Set to 15min+ after dev
  );

  const refreshToken = jwt.sign(
    {
      UserInfo: {
        name: name,
        permissions: permissions,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: refreshTokenTime }
  );

  // Creating securing cookie using refresh token named jwt
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: false, // ***************SET TRUE IN DEPLOYEMENT NEED HTTPS*****************
    sameSite: "None", //allow cross-site as server and client stored in different hosts
    maxAge: 24 * 60 * 60 * 1000, //match cookie expiry to refresh token
  });

  res.json({ accessToken });
};

// ACCESS: PUBLIC
const studentLogin = async (req, res, next) => {
  const existUser = await User.findOne({
    name: req.body.name,
    permissions: req.body.permissions,
  }).exec();
  if (!existUser) {
    return next(new APIError("User not registered.", 400));
  }

  createTokens(res, existUser.name, existUser.permissions);
};

// ACCESS: PUBLIC - GATED BY GOOGLE LOGIN
const adminLogin = async (req, res, next) => {
  if (!req.body.name) {
    return next(new APIError("Name not provided.", 400));
  }

  const existUser = await User.findOne({
    name: req.body.name,
    permissions: "admin",
  }).exec();

  if (!existUser) {
    return next(new APIError("Admin not registered.", 400));
  }

  createTokens(res, existUser.name, existUser.permissions);
};

// ACCESS: PUBLIC
// DESCRIPTION: refresh acess token if expired
const refresh = async (req, res, next) => {
  //Expect cookie

  if (!req.cookies.jwt) {
    return next(new APIError("Missing cookie.", 400));
  }

  const refreshToken = req.cookies.jwt;

  let decoded, existUser, accessToken;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    existUser = await User.findOne({
      name: decoded.name,
      permissions: decoded.permissions,
    });

    if (!existUser) {
      throw new Error();
    }

    // create new access token
    accessToken = jwt.sign(
      {
        UserInfo: {
          name: existUser.username,
          permissions: existUser.permissions,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: accessTokenTime } // Set to 15min+ after dev
    );
  } catch (e) {
    return next(new APIError("Forbidden.", 403));
  }
  res.json({ accessToken });
};

// ACCESS: PUBLIC
// DESCRIPTION: clear cookies if exists
const logout = async (req, res, next) => {
  //Expect cookies
  if (!req.cookies?.jwt) {
    return next(new APIError("Missing cookie.", 400));
  }
  // ***************SET secure: TRUE IN DEPLOYEMENT NEED HTTPS*****************
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: false });
  res.json({ message: "Logged out" });
};

export { studentLogin, adminLogin, refresh, logout };
