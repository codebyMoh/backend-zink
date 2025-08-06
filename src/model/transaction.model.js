const { default: mongoose } = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    fromToken: {
      type: String,
      required: true,
    },
    toToken: {
      type: String,
      required: true,
    },
    chain: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tokenPrice: {
      type: Number,
      required: true,
    },
    amountInDollar: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    tx: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = (db) => db.model("Transaction", transactionSchema);
