const { default: mongoose } = require("mongoose");

const realizedPnlHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    wallet: {
      type: String,
      index: true,
      required: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = (db) =>
  db.model("realizedpnlhistory", realizedPnlHistorySchema);
