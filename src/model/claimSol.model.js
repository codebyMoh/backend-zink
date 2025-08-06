const { default: mongoose } = require("mongoose");
const claimSolSchema = new mongoose.Schema(
  {
    destWallet: {
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
module.exports = (db) => db.model("claimsolschema", claimSolSchema);
