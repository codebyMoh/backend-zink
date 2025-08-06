const { db } = require("../../model");
const { redis } = require("../redis/redisConnect");
const moment = require("moment");

async function totalVolume() {
  try {
    const startOfToday = moment().startOf("day").toDate();
    const startOfWeek = moment().startOf("week").toDate();
    const startOfMonth = moment().startOf("month").toDate();
    const startOfYear = moment().startOf("year").toDate();

    // Aggregation queries for different timeframes
    const [vol1d, vol1w, vol1m, vol1y, volAll] = await Promise.all([
      db.transaction.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$amountInDollar" } } },
      ]),
      db.transaction.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$amountInDollar" } } },
      ]),
      db.transaction.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amountInDollar" } } },
      ]),
      db.transaction.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$amountInDollar" } } },
      ]),
      db.transaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amountInDollar" } } },
      ]),
    ]);

    const formatVolume = (val) => Number((val || 0).toFixed(4));

    const volumeStats = {
      volume1d: { dailyVolume: formatVolume(vol1d[0]?.total) },
      volume1w: { weeklyVolume: formatVolume(vol1w[0]?.total) },
      volume1m: { monthlyVolume: formatVolume(vol1m[0]?.total) },
      volume1y: { yearlyVolume: formatVolume(vol1y[0]?.total) },
      volumeAll: { totalVolume: formatVolume(volAll[0]?.total) },
    };

    // Store in Redis
    await Promise.all([
      redis.set(
        "dashboardStats:volume_1d",
        JSON.stringify(volumeStats.volume1d)
      ),
      redis.set(
        "dashboardStats:volume_1w",
        JSON.stringify(volumeStats.volume1w)
      ),
      redis.set(
        "dashboardStats:volume_1m",
        JSON.stringify(volumeStats.volume1m)
      ),
      redis.set(
        "dashboardStats:volume_1y",
        JSON.stringify(volumeStats.volume1y)
      ),
      redis.set(
        "dashboardStats:volume_all",
        JSON.stringify(volumeStats.volumeAll)
      ),
    ]);
  } catch (err) {
    console.log("❌ Volume Stats Error:", err.message || err);
  }
}

async function totalFee() {
  try {
    const startOfToday = moment().startOf("day").toDate();
    const startOfWeek = moment().startOf("week").toDate();
    const startOfMonth = moment().startOf("month").toDate();
    const startOfYear = moment().startOf("year").toDate();

    const [fee1d, fee1w, fee1m, fee1y, feeAll] = await Promise.all([
      db.feeCollection.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } },
      ]),
      db.feeCollection.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } },
      ]),
      db.feeCollection.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } },
      ]),
      db.feeCollection.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$feeAmount" } } },
      ]),
      db.feeCollection.aggregate([
        { $group: { _id: null, total: { $sum: "$feeAmount" } } },
      ]),
    ]);

    const formatFee = (val) => Number((val || 0).toFixed(4));

    const feeStats = {
      fee1d: { dailyFee: formatFee(fee1d[0]?.total) },
      fee1w: { weeklyFee: formatFee(fee1w[0]?.total) },
      fee1m: { monthlyFee: formatFee(fee1m[0]?.total) },
      fee1y: { yearlyFee: formatFee(fee1y[0]?.total) },
      feeAll: { totalFee: formatFee(feeAll[0]?.total) },
    };

    await Promise.all([
      redis.set("dashboardStats:fee_1d", JSON.stringify(feeStats.fee1d)),
      redis.set("dashboardStats:fee_1w", JSON.stringify(feeStats.fee1w)),
      redis.set("dashboardStats:fee_1m", JSON.stringify(feeStats.fee1m)),
      redis.set("dashboardStats:fee_1y", JSON.stringify(feeStats.fee1y)),
      redis.set("dashboardStats:fee_all", JSON.stringify(feeStats.feeAll)),
    ]);
  } catch (error) {
    console.log("❌ Fee Stats Error:", error.message || error);
  }
}


async function totalReferredBy() {
  try {
    const count = await db?.user?.countDocuments({
      referredBy: { $ne: null },
    });

    // console.log("🚀 ~ totalReferredBy ~ count:", count);

    await redis.set("totalReferredBy", count);
  } catch (error) {
    console.log(error.msg || error.message);
  }
}

async function getDashboardStats() {
  try {
    const startOfToday = moment().startOf("day").toDate();
    const startOfWeek = moment().startOf("week").toDate();
    const startOfMonth = moment().startOf("month").toDate();
    const startOfYear = moment().startOf("year").toDate();

    const totalUsers = await db.user.countDocuments();

    // Get users by time ranges
    const [todayUsers, weekUsers, monthUsers, yearUsers] = await Promise.all([
      db.user
        .find({ createdAt: { $gte: startOfToday } })
        .select("_id")
        .lean(),
      db.user
        .find({ createdAt: { $gte: startOfWeek } })
        .select("_id")
        .lean(),
      db.user
        .find({ createdAt: { $gte: startOfMonth } })
        .select("_id")
        .lean(),
      db.user
        .find({ createdAt: { $gte: startOfYear } })
        .select("_id")
        .lean(),
    ]);

    // ✅ Clear previous Redis keys
    await Promise.all(
      [
        "userStats:1d:*",
        "userStats:1w:*",
        "userStats:1m:*",
        "userStats:1y:*",
      ].map(async (pattern) => {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      })
    );

    // TTLs
    const oneDayTTL = 24 * 60 * 60;
    const oneWeekTTL = 7 * 24 * 60 * 60;
    const oneMonthTTL = 30 * 24 * 60 * 60;
    const oneYearTTL = 365 * 24 * 60 * 60;

    // Store Redis keys per user
    await Promise.all([
      ...todayUsers.map((user) =>
        redis.set(`userStats:1d:${user._id}`, "1", "EX", oneDayTTL)
      ),
      ...weekUsers.map((user) =>
        redis.set(`userStats:1w:${user._id}`, "1", "EX", oneWeekTTL)
      ),
      ...monthUsers.map((user) =>
        redis.set(`userStats:1m:${user._id}`, "1", "EX", oneMonthTTL)
      ),
      ...yearUsers.map((user) =>
        redis.set(`userStats:1y:${user._id}`, "1", "EX", oneYearTTL)
      ),
    ]);

    // Count Redis keys
    const [userStats1dKeys, userStats1wKeys, userStats1mKeys, userStats1yKeys] =
      await Promise.all([
        redis.keys("userStats:1d:*"),
        redis.keys("userStats:1w:*"),
        redis.keys("userStats:1m:*"),
        redis.keys("userStats:1y:*"),
      ]);

    const userStats = {
      userStatsAll: { totalUsers },
      userStats1d: { dailyUserCount: userStats1dKeys.length },
      userStats1w: { weeklyUserCount: userStats1wKeys.length },
      userStats1m: { monthlyUserCount: userStats1mKeys.length },
      userStats1y: { yearlyUserCount: userStats1yKeys.length },
    };

    await Promise.all([
      redis.set(
        "dashboardStats:user_all",
        JSON.stringify(userStats.userStatsAll)
      ),
      redis.set(
        "dashboardStats:user_1d",
        JSON.stringify(userStats.userStats1d)
      ),
      redis.set(
        "dashboardStats:user_1w",
        JSON.stringify(userStats.userStats1w)
      ),
      redis.set(
        "dashboardStats:user_1m",
        JSON.stringify(userStats.userStats1m)
      ),
      redis.set(
        "dashboardStats:user_1y",
        JSON.stringify(userStats.userStats1y)
      ),
    ]);
  } catch (error) {
    console.log("❌ Dashboard Stats Error:", error.message || error);
  }
}

async function callAllAdminFunction() {
  try {
    await Promise.allSettled([
      totalVolume(),
      totalFee(),
      totalReferredBy(),
      getDashboardStats(),
    ]);
  } catch (error) {
    console.log("🚀 ~ callAllAdminFunction ~ error:", error?.message);
  }
}

module.exports = {
  callAllAdminFunction,
};
