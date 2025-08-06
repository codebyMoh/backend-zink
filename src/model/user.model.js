const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const JWT_SECRATE = process.env.JWT_USER_SECRET;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    phantomAddress: {
      type: String,
      default: null,
    },
    buysTradeCount: {
      type: Number,
      default: 0,
    },
    sellsTradeCount: {
      type: Number,
      default: 0,
    },
    realizedPnl: {
      type: Number,
      default: 0,
    },
    solTurnkeyId: {
      type: String,
    },
    walletAddressSOL: [
      {
        wallet: {
          type: String,
          required: true,
        },
        primary: {
          type: Boolean,
          default: false,
          required: true,
        },
        index: {
          type: Number,
          required: true,
        },
      },
    ],
    walletAddressEVM: {
      type: String,
    },
    evmTurnkeyId: {
      type: String,
    },
    tradeDateInfo: {
      time: {
        type: Number,
        default: 0,
      },
      totalTradePerDay: {
        type: Number,
        default: 0,
      },
      pointsAddedPerDay: {
        type: Boolean,
        default: false,
      },
    },
    weeklyTradeDateInfo: {
      time: {
        type: Number,
        default: 0,
      },
      totalTradeAmount: {
        type: Number,
        default: 0,
      },
      pointsAddedPerWeekTrade: {
        type: Boolean,
        default: false,
      },
    },
    totalTradeAmount: {
      type: Number,
      default: 0,
    },
    totalTradeAmountInUsd: {
      type: Number,
      default: 0,
    },
    tradeAmountForReferredBy: {
      type: Number,
      default: 0,
    },
    dailyTrade: {
      type: Number,
      default: 0,
    },
    tradePoints: {
      type: Number,
      default: 0,
    },
    dailyPoints: {
      type: Number,
      default: 0,
    },
    weeklyPoints: {
      type: Number,
      default: 0,
    },
    refferalPoints: {
      type: Number,
      default: 0,
    },
    feeCollected: {
      type: Number,
      default: 0,
    },
    totalClaimed: {
      type: Number,
      default: 0,
    },
    totalPointsClaimed: {
      type: Number,
      default: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    verify: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    otp: {
      type: Number,
      default: null,
    },
    referralId: {
      type: String,
      default: null,
      index: true,
    },
    referralEdit: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    referredByone: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    referredByTwo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    referredByThree: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredByFour: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredByFive: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredBySix: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredBySeven: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredByEight: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referredByNine: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referralAddedAt: {
      type: Date,
    },
    feePercentage: {
      type: Number,
      default: 0.9,
    },
    referralFeePercentage: {
      type: Number,
      default: 0.9,
    },
    referealRewardsFirstTierPer: {
      type: Number,
      default: 35,
    },
    referealRewardsSecondTierPer: {
      type: Number,
      default: 10,
    },
    referealRewardsThirdTierPer: {
      type: Number,
      default: 5,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// bcrypt password before saved
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// generate JWT
userSchema.methods.generateJWTToken = async function (ex) {
  return JWT.sign(
    {
      _id: this._id,
      email: this.email,
    },
    JWT_SECRATE,
    { expiresIn: ex }
  );
};

module.exports = (db) => db.model("User", userSchema);
