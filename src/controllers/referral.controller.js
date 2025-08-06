const { code } = require("../../constant/code");
const { db } = require("../model");
const { apiResponse } = require("../utils/apiResponse");
const ThrowError = require("../utils/ThrowError");
// add referral
async function addReferral(req, res) {
  if (req?.user?.referredBy) {
    return ThrowError(code.BAD_REQUEST, "Invite code is already added.");
  }
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return ThrowError(code.BAD_REQUEST, "Invite code is required.");
  }
  const inviteUser = await db?.user.findOne({ referralId: inviteCode });
  if (!inviteUser) {
    return ThrowError(code.BAD_REQUEST, "Invalid invite code.");
  }
  const updateUser = await db?.user.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        referredBy: inviteUser?._id,
        referredByone: inviteUser?.referredBy || null,
        referredByTwo: inviteUser?.referredByone || null,
        referredByThree: inviteUser?.referredByTwo || null,
        referredByFour: inviteUser?.referredByThree || null,
        referredByFive: inviteUser?.referredByFour || null,
        referredBySix: inviteUser?.referredByFive || null,
        referredBySeven: inviteUser?.referredBySix || null,
        referredByEight: inviteUser?.referredBySeven || null,
        referredByNine: inviteUser?.referredByEight || null,
        feePercentage: inviteUser?.referralFeePercentage,
        referralAddedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!updateUser) {
    return ThrowError(code.INTERNAL_SERVER_ERROR, "Internal server error.");
  }
  return apiResponse(res, code.SUCCESS, "Invite code added successfully.", {
    user: {
      _id: updateUser?._id,
      email: updateUser?.email,
      verify: updateUser?.verify,
      referralId: updateUser?.referralId,
      referredBy: updateUser?.referredBy,
    },
  });
}

// get three tier referrals
async function get3TierRefferals(req, res) {
  const user = req.user;
  const referrals3Tier = await db.user.aggregate([
    {
      $facet: {
        firstTier: [
          { $match: { referredBy: user._id } },
          {
            $project: {
              email: 1,
              totalTrades: 1,
              feeCollected: 1,
              totalTradeAmount: 1,
              referralAddedAt: 1,
              phantomAddress: 1,
            },
          },
        ],
        secondTier: [
          { $match: { referredByone: user._id } },
          {
            $project: {
              email: 1,
              totalTrades: 1,
              feeCollected: 1,
              totalTradeAmount: 1,
              referralAddedAt: 1,
              phantomAddress: 1,
            },
          },
        ],
        thirdTier: [
          { $match: { referredByTwo: user._id } },
          {
            $project: {
              email: 1,
              totalTrades: 1,
              feeCollected: 1,
              totalTradeAmount: 1,
              referralAddedAt: 1,
              phantomAddress: 1,
            },
          },
        ],
      },
    },
  ]);
  const finalReferrals = referrals3Tier[0];
  let totalFirstTier = {
    feeCollected: 0,
    totalTradeAmount: 0,
    totalTrades: 0,
  };
  let totalSecondTier = {
    feeCollected: 0,
    totalTradeAmount: 0,
    totalTrades: 0,
  };
  let totalThirdTier = {
    feeCollected: 0,
    totalTradeAmount: 0,
    totalTrades: 0,
  };
  let totalEarning = {
    totalEarningsFrist: 0,
    totalEarningsSecond: 0,
    totalEarningsThird: 0,
  };
  if (finalReferrals?.firstTier?.length > 0) {
    totalFirstTier = await finalReferrals?.firstTier.reduce(
      (acc, curr) => ({
        feeCollected: acc.feeCollected + curr.feeCollected,
        totalTradeAmount: acc.totalTradeAmount + curr.totalTradeAmount,
        totalTrades: acc.totalTrades + curr.totalTrades,
      }),
      { feeCollected: 0, totalTradeAmount: 0, totalTrades: 0 }
    );
    totalEarning.totalEarningsFrist =
      (Number(totalFirstTier.feeCollected) *
        user?.referealRewardsFirstTierPer) /
      100;
  }
  if (finalReferrals?.secondTier?.length > 0) {
    totalSecondTier = await finalReferrals?.secondTier.reduce(
      (acc, curr) => ({
        feeCollected: acc.feeCollected + curr.feeCollected,
        totalTradeAmount: acc.totalTradeAmount + curr.totalTradeAmount,
        totalTrades: acc.totalTrades + curr.totalTrades,
      }),
      { feeCollected: 0, totalTradeAmount: 0, totalTrades: 0 }
    );
    totalEarning.totalEarningsSecond =
      (Number(totalSecondTier.feeCollected) *
        user?.referealRewardsSecondTierPer) /
      100;
  }
  if (finalReferrals?.thirdTier?.length > 0) {
    totalThirdTier = await finalReferrals?.thirdTier.reduce(
      (acc, curr) => ({
        feeCollected: acc.feeCollected + curr.feeCollected,
        totalTradeAmount: acc.totalTradeAmount + curr.totalTradeAmount,
        totalTrades: acc.totalTrades + curr.totalTrades,
      }),
      { feeCollected: 0, totalTradeAmount: 0, totalTrades: 0 }
    );
    totalEarning.totalEarningsThird =
      (Number(totalThirdTier.feeCollected) *
        user?.referealRewardsThirdTierPer) /
      100;
  }
  const totalEarnings =
    totalEarning.totalEarningsFrist +
    totalEarning.totalEarningsSecond +
    totalEarning.totalEarningsThird;
  return apiResponse(res, code.SUCCESS, "Records found.", {
    user: {
      email: user?.email,
      phantomAddress: user?.phantomAddress,
      referralId: user?.referralId,
      totalClaimed: user?.totalClaimed,
      totalTrades: user?.totalTrades,
      feeCollected: user?.feeCollected,
      totalTradeAmount: user?.totalTradeAmount,
      referealRewardsFirstTierPer: user?.referealRewardsFirstTierPer,
      referealRewardsSecondTierPer: user?.referealRewardsSecondTierPer,
      referealRewardsThirdTierPer: user?.referealRewardsThirdTierPer,
      dailyPoints: user?.dailyPoints,
      referralPoints: user?.refferalPoints,
      tradePoints: user?.tradePoints,
      weeklyPoints: user?.weeklyPoints,
      totalPointsClaimed: user?.totalPointsClaimed,
    },
    referrals: finalReferrals,
    totalFeeCollected:
      totalFirstTier?.feeCollected +
      totalSecondTier?.feeCollected +
      totalThirdTier?.feeCollected,
    totalTrades:
      totalFirstTier?.totalTrades +
      totalSecondTier?.totalTrades +
      totalThirdTier?.totalTrades,
    totalTradeAmount:
      totalFirstTier?.totalTradeAmount +
      totalSecondTier?.totalTradeAmount +
      totalThirdTier?.totalTradeAmount,
    totalEarningInSol: totalEarnings,
  });
}

// edit referralId for one time only
async function editReferralId(req, res) {
  const user = req.user;
  if (user?.referralEdit) {
    return ThrowError(
      code.NOT_ALLOWED,
      "You already edit your referralId once."
    );
  }
  const { referralId } = req.body;
  // chech referralId
  if (!referralId) {
    return ThrowError(code.BAD_REQUEST, "ReferralId is required.");
  }
  // check referral is not same
  if (user?.referralId == referralId) {
    return ThrowError(
      code.BAD_REQUEST,
      "Previous and current referralid is same choose different."
    );
  }
  if (referralId?.toString().length > 9 || referralId?.toString().length < 1) {
    // check the length of referralId
    return ThrowError(
      code.BAD_REQUEST,
      "Length is not more then 9 and less than 1."
    );
  }
  // checkReferralId is exist or not
  const isReferralIdExist = await db?.user?.findOne({ referralId: referralId });
  if (isReferralIdExist) {
    return ThrowError(
      code.NOT_ALLOWED,
      "Referralid already exist please choose different."
    );
  }
  // updating referralId
  const updateRefId = await db?.user?.findByIdAndUpdate(
    user._id,
    {
      $set: { referralId: referralId.toString(), referralEdit: true },
    },
    { new: true }
  );
  return apiResponse(res, code.SUCCESS, "ReferralId edit successfully.", {
    referralId: updateRefId?.referralId,
  });
}
module.exports = { addReferral, get3TierRefferals, editReferralId };
