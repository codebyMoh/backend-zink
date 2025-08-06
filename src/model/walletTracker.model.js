const { default: mongoose } = require("mongoose");

const walletTrackersWalletsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    chain: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    walletName: {
      type: String,
      required: true,
    },
    lastActive: {
      type: Date,
    },
    alert: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    tag: {
      type: Array,
    },
  },
  { timestamps: true }
);

module.exports = (db) => db.model("wallettracker", walletTrackersWalletsSchema);
