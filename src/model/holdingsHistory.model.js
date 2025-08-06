const { default: mongoose } = require("mongoose");

const holdingsHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
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
    pnlPercentage: {
      type: Number,
      default: 0,
      index: true,
    },
    realizedProfit: {
      type: Number,
      default: 0,
    },
    qty: {
      type: Number,
      default: 0,
    },
    buyPrice: {
      type: Number,
      default: 0,
    },
    sellPrice: {
      type: Number,
      default: 0,
    },
    solAvgPriceBuy: {
      type: Number,
      default: 0,
    },
    solAvgPriceSell: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
    },
    img: {
      type: String,
    },
    symbol: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = (db) => db.model("holdingshistory", holdingsHistorySchema);
