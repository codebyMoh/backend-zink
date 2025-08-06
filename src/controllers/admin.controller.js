const { code } = require("../../constant/code");
const { apiResponse } = require("../utils/apiResponse");
const ThrowError = require("../utils/ThrowError");
const { db } = require("../model/index");

const { redis } = require("../services/redis/redisConnect");

// get Dashbord Data From Redis
async function getDashboardUserStats(req, res) {
  const keys = [
    "dashboardStats:user_1d",     // 0
    "dashboardStats:user_1w",     // 1
    "dashboardStats:user_1m",     // 2
    "dashboardStats:user_1y",     // 3
    "dashboardStats:user_all",    // 4
    "dashboardStats:volume_1d",   // 5
    "dashboardStats:volume_1w",   // 6
    "dashboardStats:volume_1m",   // 7
    "dashboardStats:volume_1y",   // 8
    "dashboardStats:volume_all",  // 9
    "dashboardStats:fee_1d",      // 10
    "dashboardStats:fee_1w",      // 11
    "dashboardStats:fee_1m",      // 12
    "dashboardStats:fee_1y",      // 13
    "dashboardStats:fee_all",     // 14
    "totalReferredBy",            // 15 ✅
    "totalVolume",                // 16 (Optional, if used separately)
  ];

  const values = await redis.mget(...keys);

  return apiResponse(res, code.SUCCESS, "Data Get Successfully.", {
    user: {
      "1d": Number(JSON.parse(values[0])?.dailyUserCount || 0),
      "1w": Number(JSON.parse(values[1])?.weeklyUserCount || 0),
      "1m": Number(JSON.parse(values[2])?.monthlyUserCount || 0),
      "1y": Number(JSON.parse(values[3])?.yearlyUserCount || 0),
      total: Number(JSON.parse(values[4])?.totalUsers || 0),
    },
    totalVolume: {
      "1d": Number(JSON.parse(values[5])?.dailyVolume || 0),
      "1w": Number(JSON.parse(values[6])?.weeklyVolume || 0),
      "1m": Number(JSON.parse(values[7])?.monthlyVolume || 0),
      "1y": Number(JSON.parse(values[8])?.yearlyVolume || 0),
      total: Number(JSON.parse(values[9])?.totalVolume || 0),
    },
    totalFees: {
      "1d": Number(JSON.parse(values[10])?.dailyFee || 0),
      "1w": Number(JSON.parse(values[11])?.weeklyFee || 0),
      "1m": Number(JSON.parse(values[12])?.monthlyFee || 0),
      "1y": Number(JSON.parse(values[13])?.yearlyFee || 0),
      total: Number(JSON.parse(values[14])?.totalFee || 0),
    },
    totalReferred: Number(values[15] || 0),
  });
}

// Admin Login
async function loginAdmin(req, res) {
  const { email, password } = req?.body;
  if (!email || !password) {
    return ThrowError(code.BAD_REQUEST, "Password and Email is required.");
  }
  const user = await db?.adminUser.findOne({ email });
  if (!user) {
    return ThrowError(code.UNAUTHORIZED, "Unauthorized request(admin).");
  }
  const isPasswwordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswwordCorrect) {
    return ThrowError(code.BAD_REQUEST, "Invalid credentials.");
  }
  const generateJwtToken = await user.generateJWTToken("30d");
  if (!generateJwtToken) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(jwt)."
    );
  }
  return apiResponse(res, code.SUCCESS, "Login successfully.", {
    user: {
      email: user?.email,
    },
    token: generateJwtToken,
  });
}

// change Admin Password
async function changeAdminPassword(req, res) {
  const adminId = req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return ThrowError(
      code.BAD_REQUEST,
      "Current and new passwords are required."
    );
  }

  const admin = await db.adminUser.findById(adminId);
  if (!admin) {
    return ThrowError(code.UNAUTHORIZED, "Admin not found or unauthorized.");
  }

  const isMatch = await admin.isPasswordCorrect(currentPassword);
  if (!isMatch) {
    return ThrowError(code.BAD_REQUEST, "Current password is incorrect.");
  }

  admin.password = newPassword;
  await admin.save();

  return apiResponse(res, code.SUCCESS, "Password changed successfully.");
}

// Get All User List
async function getAllUser(req, res) {
  const page = Number(req?.params?.page || 0);
  const limit = Number(req?.params?.limit || 0);

  if (!page || !limit) {
    return ThrowError(code.BAD_REQUEST, "Page or limit required.");
  }

  const skip = (page - 1) * limit;

  const [totalUsersResult, usersResult] = await Promise.allSettled([
    db.user.countDocuments(),
    db.user
      .find({})
      .skip(skip)
      .limit(limit)
      .select("-password -walletAddressEVM -otp")
      .lean(),
  ]);

  if (
    totalUsersResult.status !== "fulfilled" ||
    usersResult.status !== "fulfilled"
  ) {
    return ThrowError(code.INTERNAL_SERVER_ERROR, "Internal server error.");
  }

  return apiResponse(res, code.SUCCESS, "Users fetched successfully.", {
    users: usersResult.value,
    pagination: {
      totalUsers: totalUsersResult.value,
      currentPage: page,
      totalPages: Math.ceil(totalUsersResult.value / limit),
      limit,
    },
  });
}

// Get All Transaction
async function getAllTransaction(req, res) {
  // make cursor bage pagination it will work with even millions of data
  const page = Number(req?.params?.page || 0);
  const limit = Number(req?.params?.limit || 0);
  if (!page || !limit) {
    return ThrowError(code.BAD_REQUEST, "Page or limit required.");
  }
  const skip = (page - 1) * limit;

  const [totalTransactions, transactions] = await Promise.allSettled([
    await db.transaction.countDocuments(),
    db.transaction.find({}).skip(skip).limit(limit).lean(),
  ]);
  if (
    totalTransactions?.status != "fulfilled" ||
    transactions?.status != "fulfilled"
  ) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      "Internal server error(DB operation)."
    );
  }
  if (totalTransactions?.value?.length == 0) {
    return ThrowError(code.NOT_FOUND, "Tx not found.");
  }
  return apiResponse(res, code.SUCCESS, "Transactions fetched successfully.", {
    transactions: transactions?.value,
    pagination: {
      totalTransactions: totalTransactions?.value,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions?.value / limit),
      limit,
    },
  });
}

// get Perticluer User Details
async function getUser(req, res) {
  const userId = req?.params?.userId;

  if (!userId) {
    return ThrowError(code.BAD_REQUEST, "User ID is required.");
  }

  const user = await db.user
    .findById(userId)
    .select("-password -walletAddressEVM -otp")
    .lean();

  if (!user) {
    return ThrowError(code.NOT_FOUND, "User not found.");
  }

  return apiResponse(res, code.SUCCESS, "User fetched successfully.", {
    user: user,
  });
}

// Get All fees Count
async function getAllFees(req, res) {
  const page = Number(req?.params?.page || 0);
  const limit = Number(req?.params?.limit || 0);

  if (!page || !limit) {
    return ThrowError(code.BAD_REQUEST, "Page or limit required.");
  }

  const skip = (page - 1) * limit;

  // Get total fees and count
  const [summary, feeList] = await Promise.all([
    db.feeCollection.aggregate([
      {
        $group: {
          _id: null,
          totalFeeAmount: { $sum: "$feeAmount" },
          totalFeeCount: { $sum: 1 },
        },
      },
    ]),
    db.feeCollection.find({}).skip(skip).limit(limit).lean(),
  ]);

  const result = summary[0] || { totalFeeAmount: 0, totalFeeCount: 0 };

  return apiResponse(
    res,
    code.SUCCESS,
    "All fee records fetched successfully.",
    {
      totalFeeAmount: result.totalFeeAmount,
      totalFeeCount: result.totalFeeCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.totalFeeCount / limit),
        limit,
      },
      fees: feeList,
    }
  );
}

// search User By Email
async function searchUserByEmail(req, res) {
  const { email } = req.params;

  if (!email) {
    return ThrowError(code.BAD_REQUEST, "Email is required.");
  }

  const regex = new RegExp(`^${email}`, "i");

  const users = await db.user
    .find({ email: { $regex: regex } })
    .select("-password -otp")
    .lean();

  if (!users.length) {
    return ThrowError(code.NOT_FOUND, "No users found");
  }

  return apiResponse(res, code.SUCCESS, "Users fetched successfully.", {
    count: users.length,
    users,
  });
}

// Search Transactions by tx or wallet
async function searchTransaction(req, res) {
  const { keyword } = req.params;

  if (!keyword) {
    return ThrowError(code.BAD_REQUEST, "Search keyword is required.");
  }

  const regex = new RegExp(`^${keyword}`, "i");

  const transactions = await db.transaction
    .find({
      $or: [{ tx: { $regex: regex } }, { wallet: { $regex: regex } }],
    })
    .lean();

  if (!transactions.length) {
    return ThrowError(code.NOT_FOUND, "No matching transactions found.");
  }

  return apiResponse(res, code.SUCCESS, "Transactions fetched successfully.", {
    count: transactions.length,
    transactions,
  });
}

// USer Stautus update API
async function toggleUserStatus(req, res) {
  const userId = req?.params?.userId;
  const statusParam = req?.params?.status;

  if (!userId || (statusParam !== "true" && statusParam !== "false")) {
    return ThrowError(code.BAD_REQUEST, "User ID and status ('true' or 'false') are required.");
  }

  const active = statusParam === "true";

  const updatedUser = await db.user.findByIdAndUpdate(
    userId,
    { active },
    { new: true, lean: true }
  );

  if (!updatedUser) {
    return ThrowError(code.NOT_FOUND, "User not found.");
  }

  return apiResponse(
    res,
    code.SUCCESS,
    `User ${active ? 'activated' : 'deactivated'} successfully.`,
    { user: updatedUser?.active }
  );
}

// Delete user by ID
async function deleteUser(req, res) {
  const userId = req?.params?.userId;

  if (!userId) {
    return ThrowError(code.BAD_REQUEST, "User ID is required.");
  }

  const deletedUser = await db.user.findByIdAndDelete(userId);

  if (!deletedUser) {
    return ThrowError(code.NOT_FOUND, "User not found.");
  }

  return apiResponse(res, code.SUCCESS, "User deleted successfully.");
}




module.exports = {
  loginAdmin,
  changeAdminPassword,
  getAllUser,
  getAllTransaction,
  getUser,
  getAllFees,
  searchUserByEmail,
  searchTransaction,
  getDashboardUserStats,
  toggleUserStatus,
  deleteUser,
};
