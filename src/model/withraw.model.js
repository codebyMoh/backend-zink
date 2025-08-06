const { default: mongoose } = require("mongoose");
const withrawUserSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    toWallet: {
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
    amount: {
      type: Number,
      required: true,
    },
    tx: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = (db) => db.model("withrawuser", withrawUserSchema);
