const { default: mongoose } = require("mongoose");
const tokenfavoriteSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
    },
    img: {
      type: String,
    },
    tokenAddress: {
      type: String,
    },
    marketCap: {
      type: String,
    },
    volume: {
      type: String,
    },
    Liqudity: {
      type: String,
    },
    pairaddress: {
      type: String,
    },
    tradedVolumeUSD: {
      type: Number,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = (db) => db.model("tokenfavorite", tokenfavoriteSchema);
