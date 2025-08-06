const { Router } = require("express");
const router = Router();
const transactionController = require("../controllers/solanaSwap.controller");
const transactionHandlerController = require("../controllers/transaction.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { authUser } = require("../middleware/user.auth");

// solana buy
router.post(
  "/solbuy",
  asyncHandler(authUser),
  asyncHandler(transactionController.solanaBuyJup)
);
// solana sell
router.post(
  "/solsell",
  asyncHandler(authUser),
  asyncHandler(transactionController.solanaSellJup)
);
// withraw sol for user
router.post(
  "/withrawSolUser",
  asyncHandler(authUser),
  asyncHandler(transactionController.withrawSolHandlerForUser)
);
// claimsol
router.post(
  "/claimSolana",
  asyncHandler(authUser),
  asyncHandler(transactionHandlerController.claimRewardsSolana)
);
// ========================================================== pnl =====================================================================
// PNL solana
router.get(
  "/PNLSolana/:address",
  asyncHandler(transactionHandlerController.PNLSolana)
);

// PNL history
router.get(
  "/PNLHistory/:address",
  asyncHandler(transactionHandlerController.PNLHistory)
);
// PNL history
router.get(
  "/PNLHistoryTop/:address",
  asyncHandler(transactionHandlerController.PNLHistoryTop)
);

// PNL performace history
router.get(
  "/PNLPerformance/:address",
  asyncHandler(transactionHandlerController.PNLPerformance)
);

// single token PNL for user
router.get(
  "/getSingleTokenPnl/:token/:walletAddress",
  asyncHandler(authUser),
  asyncHandler(
    transactionHandlerController.getPnlForParticulerUserForSingleToken
  )
);

// get single token last action
router.get(
  "/getSingleTokenlastAction/:token/:walletAddress",
  asyncHandler(authUser),
  asyncHandler(transactionHandlerController.getSingleTokenlastAction)
);

// leaderboard
router.get(
  "/leaderBoard",
  asyncHandler(transactionHandlerController.leaderBoard)
);
// trnsaction history
router.get(
  "/history/:limit/:page",
  asyncHandler(authUser),
  asyncHandler(transactionHandlerController.transactionHistory)
);
module.exports = router;
