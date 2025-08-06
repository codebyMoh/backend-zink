const { code } = require("../../constant/code");
const ThrowError = require("../utils/ThrowError");
const JWT = require("jsonwebtoken");
const { db } = require("../model/index");
const JWT_SECRATE = process.env.JWT_ADMIN_SECRET;
async function authAdminuser(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return ThrowError(code.UNAUTHORIZED, "Unauthorized request");
  }
  // decode token
  const decodeToken = await JWT.verify(token, JWT_SECRATE);
  if (!decodeToken) {
    return ThrowError(code.UNAUTHORIZED, "Unauthorized request");
  }
  // check user exist or not
  const isUserExist = await db?.adminUser
    .findById(decodeToken?._id)
    .select("-password");
  if (!isUserExist) {
    return ThrowError(code.UNAUTHORIZED, "Unauthorized request");
  }
  req.user = isUserExist;
  next();
}

module.exports = { authAdminuser };
