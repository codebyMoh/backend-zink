const { default: mongoose } = require("mongoose");

const fifoLotSchema = new mongoose.Schema({
  qty: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  solPrice: {
    type: Number,
    default: 0,
  },
});

const fifoHoldingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wallet: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    img: {
      type: String,
      index: true,
    },
    lots: [fifoLotSchema],
    realizedProfit: {
      type: Number,
      default: 0,
    },
    activeQtyHeld: {
      type: Number,
      default: 0,
    },
    quantitySold: {
      type: Number,
      default: 0,
    },
    sellCount: {
      type: Number,
      default: 0,
    },
    totalBuyAmount: {
      type: Number,
      default: 0,
    },
    averageBuyPrice: {
      type: Number,
      default: 0,
    },
    averageSolBuyPrice: {
      type: Number,
      default: 0,
    },
    averageSolSellPrice: {
      type: Number,
      default: 0,
    },
    averageHistoricalSellPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = (db) => db.model("fifoholdings", fifoHoldingsSchema);
