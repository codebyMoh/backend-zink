const { Router } = require("express");
const router = Router();
const userController = require("../controllers/user.controller");
const referralController = require("../controllers/referral.controller");
const generateWalletWithSamePhraseController = require("../controllers/generateWalletWithSamePhrase.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { authUser, authUserBeforeVerify } = require("../middleware/user.auth");

// signup
router.post("/signup", asyncHandler(userController.signup));

// verify
router.post(
  "/verify",
  asyncHandler(authUserBeforeVerify),
  asyncHandler(userController.verifySignup)
);

// login
router.post("/login", asyncHandler(userController.login));

// google login or signup
router.post("/googleAuth", asyncHandler(userController.googleLogin));

// phantom login or signup
router.post("/phantomLogin", asyncHandler(userController.phantomLogin));

// ========================================= get user detials ===================================>
router.get(
  "/userDetails",
  asyncHandler(authUser),
  asyncHandler(userController.userDetails)
);

// ====================================== referral ===============================================>
// add referral
router.put(
  "/addreferral",
  asyncHandler(authUser),
  asyncHandler(referralController.addReferral)
);

// get three tier referral
router.get(
  "/get3TierRefferals",
  asyncHandler(authUser),
  asyncHandler(referralController.get3TierRefferals)
);

// edit referral for one time only
router.put(
  "/editReferralId",
  asyncHandler(authUser),
  asyncHandler(referralController.editReferralId)
);

// ========================================= generate wallets ===========================================>
// generate sol wallet with same phrase only for register users will not work with non registerd user.
router.put(
  "/generateSolWallet",
  asyncHandler(authUser),
  asyncHandler(generateWalletWithSamePhraseController.generateSolanaWallet)
);

// make sol wallet primary
router.put(
  "/makeSolWalletPrimary",
  asyncHandler(authUser),
  asyncHandler(generateWalletWithSamePhraseController.makePrimaryWallet)
);

// get all wallets
router.get(
  "/getAllWallets",
  asyncHandler(authUser),
  asyncHandler(generateWalletWithSamePhraseController.getAllWalletsOfuser)
);

//========================================= Create Token Favourite ===========================================>
router.post(
  "/createTokenFavourite",
  asyncHandler(authUser),
  asyncHandler(userController.createTokenFavorite)
);

router.delete(
  "/deleteTokenFavorite",
  asyncHandler(authUser),
  asyncHandler(userController.deleteTokenFavorite)
);

router.get(
  "/getUserTokenFavorites",
  asyncHandler(authUser),
  asyncHandler(userController.getUserTokenFavorites)
);

router.get(
  "/checkTokenFavorite/:tokenaddress",
  asyncHandler(authUser),
  asyncHandler(userController.checkTokenFavorite)
);

// ================================================== pk ====================================>

// Pk for particuler wallet
router.get(
  "/getSolanaPk/:wallet/:index",
  asyncHandler(authUser),
  asyncHandler(userController.generatePkSolana)
);

// phrase solana
router.get(
  "/getSolanaPhrase",
  asyncHandler(authUser),
  asyncHandler(userController.getSolPhrase)
);

// ==================================== balances of wallets ====================================>
router.get(
  "/getWalletBalances",
  asyncHandler(authUser),
  asyncHandler(userController.getWalletBalances)
);

// check user is exist on the db or not by wallet address
router.get(
  "/checkWallet/:address",
  asyncHandler(userController.checkWalletExist)
);
module.exports = router;
