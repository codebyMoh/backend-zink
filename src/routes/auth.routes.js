const express = require('express');
const router = express.Router();
const multer = require("multer");
const upload = multer();
const authController = require('../controllers/auth.controller');
const { APP_SCHEME, WEB_URL } = require("../utils/constants");

router.get('/authorize', authController.googleAuthorize);
router.get("/session", authController.getSession);
router.post('/token', upload.none(), authController.exchangeGoogleCode);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken);

router.get("/callback", async (req, res) => {
  const combinedPlatformAndState = req.query.state;

  if (!combinedPlatformAndState) {
    return res.status(400).json({ error: "Invalid state" });
  }

  const [platform, state] = combinedPlatformAndState.split("|");

  const code = req.query.code;

  const redirectParams = new URLSearchParams({
    code: code || "",
    state: state || "",
  });

  const redirectUrl =
    (platform === "web" ? WEB_URL : APP_SCHEME) +
    "?" +
    redirectParams.toString();

  return res.redirect(redirectUrl);
});

module.exports = router;
