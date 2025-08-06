const { default: mongoose } = require("mongoose");
const feeCollectionSchema = new mongoose.Schema(
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
    chain: {
      type: Number,
      required: true,
    },
    feeAmount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    tradeTx: {
      type: String,
      required: true,
    },
    tx: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = (db) => db.model("feecollections", feeCollectionSchema);
