const { code } = require("../../constant/code");
const { db } = require("../model");
const { getSolanaPhrase } = require("../services/encryption");
const {
  generateSolWalletWithSamePhrase,
} = require("../services/generateWalletUsingPhrase/generateWalletSol");
const {
  createWalletsAccountOnSameSeed,
} = require("../services/turnkey/createWalletOnTurnkey");
const { apiResponse } = require("../utils/apiResponse");
const ThrowError = require("../utils/ThrowError");

// generate wallet
async function generateSolanaWallet(req, res) {
  const user = req.user;
  const lengthOfWallets = user?.walletAddressSOL?.length;
  if (lengthOfWallets >= 25) {
    return ThrowError(
      code.NOT_ALLOWED,
      "You can't generate wallet more than 25"
    );
  }
  const generateWallet = await createWalletsAccountOnSameSeed(
    lengthOfWallets,
    user?.solTurnkeyId
  );
  if (!generateWallet?.address) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(generate wallet Address)."
    );
  }
  const solWallet = {
    wallet: generateWallet?.address,
    primary: false,
    index: generateWallet?.index,
  };
  user?.walletAddressSOL.push(solWallet);
  await user.save();
  return apiResponse(res, code.SUCCESS, "Wallet generated.", {
    wallet: solWallet,
  });
}

// make primary
async function makePrimaryWallet(req, res) {
  const { index } = req.body;
  const user = req.user;
  if (index == null || index == undefined || typeof index !== "number") {
    return ThrowError(code.BAD_REQUEST, "Index is required.");
  }
  const findActiveWalletIndex = await user?.walletAddressSOL?.findIndex(
    (item) => item?.primary
  );
  const findWalletIndexToMakeActive = await user?.walletAddressSOL?.findIndex(
    (item) => item?.index == index
  );
  if (findWalletIndexToMakeActive == -1) {
    return ThrowError(code.BAD_REQUEST, "Invalid Index");
  } else if (findActiveWalletIndex == -1) {
    user.walletAddressSOL[findWalletIndexToMakeActive].primary = true;
    await user.save();
    return apiResponse(res, code.SUCCESS, "Wallet update to primary.", {
      wallet: user?.walletAddressSOL[Number(findWalletIndexToMakeActive)],
    });
  }

  // check is both index are same then its already in primary
  if (findActiveWalletIndex == findWalletIndexToMakeActive) {
    return ThrowError(code.BAD_REQUEST, "The wallet is already in primary");
  }
  // make x primary false and currenct one is primary
  user.walletAddressSOL[findActiveWalletIndex].primary = false;
  user.walletAddressSOL[findWalletIndexToMakeActive].primary = true;
  await user.save();
  return apiResponse(res, code.SUCCESS, "Wallet update to primary.", {
    wallet: user?.walletAddressSOL[Number(findWalletIndexToMakeActive)],
  });
}

// get all user wallet
async function getAllWalletsOfuser(req, res) {
  const user = req?.user;
  const userFind = await db?.user
    ?.findOne({ _id: user?._id })
    .select(
      "-password -active -otp -verify -referralId -referredBy -walletAddressEVM"
    );
  await apiResponse(res, code.SUCCESS, "User wallets fetched.", {
    wallets: userFind,
  });
}

module.exports = {
  generateSolanaWallet,
  makePrimaryWallet,
  getAllWalletsOfuser,
};
