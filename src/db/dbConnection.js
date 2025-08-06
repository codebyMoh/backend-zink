require("dotenv").config();
const mongoose = require("mongoose");
const DB_USER = process.env.DB_USER_URL;
async function DBconnection() {
  const userDB = await mongoose.createConnection(DB_USER, {
    autoIndex: true,
  });
  return { userDB };
}
module.exports = { DBconnection };
