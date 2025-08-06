function generateOtp() {
  const otp = Math.floor(Math.random() * 99999 + 100000);
  return otp;
}

module.exports = { generateOtp };
