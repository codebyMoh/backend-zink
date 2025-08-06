require("dotenv").config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  service: "gmail",
  auth: {
    user: process.env.SMTPGMAIL,
    pass: process.env.GMAILAPPKEY,
  },
});
module.exports = { transporter };
