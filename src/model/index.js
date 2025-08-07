const { DBconnection } = require("../db/dbConnection");
const createUserModel = require("./user.model");
const transactionModel = require("./transaction.model");
const walletTrackerModel = require("./walletTracker.model");
const tokenFavoriteModel = require("./tokenFavorite.model");
const feeCollectionModel = require("./feeCollection.model");
const claimSolanaModel = require("./claimSol.model");
const fifoHoldingsModel = require("./fifolotSchema.model");
const addressAiSignleModel = require("./addresses.model");
const aiSignalTokenAllLiveData = require("./AIsignle.model");
const withrawUsermodel = require("./withraw.model");
const holdingsHistoryModel = require("./holdingsHistory.model");
const realizedPnlHistoryModel = require("./realizedPnlHistory.model");
const adminUserModel = require("./admin.model");
const db = {};
async function intialModels() {
  const { userDB } = await DBconnection();
  if (!userDB) {
    console.log("Something wen wrong while connecting DB!");
  }
  console.log("✅ Databases connected!!");
  // initial models
  // main DB
  db.User = await createUserModel(userDB);
  // db.transaction = await transactionModel(userDB);
  // db.walletTracker = await walletTrackerModel(userDB);
  // db.tokenFavorite = await tokenFavoriteModel(userDB);
  // db.feeCollection = await feeCollectionModel(userDB);
  // db.claimSolana = await claimSolanaModel(userDB);
  // db.fifoHoldings = await fifoHoldingsModel(userDB);
  // db.addressAiSignle = await addressAiSignleModel(userDB);
  // db.aiSignalTokenAllLiveData = await aiSignalTokenAllLiveData(userDB);
  // db.withrawUsermodel = await withrawUsermodel(userDB);
  // db.holdingsHistory = await holdingsHistoryModel(userDB);
  // db.realizedPnlHistory = await realizedPnlHistoryModel(userDB);
  // db.adminUser = await adminUserModel(userDB);
  console.log("✅ All models intialized!!");
}

module.exports = { intialModels, db };
