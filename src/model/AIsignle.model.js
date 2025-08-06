const mongoose = require("mongoose");

const aiSignalTokenAllLiveData = new mongoose.Schema(
  {
    tokens: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = (db) =>
  db.model("aiSignalTokenAllLiveData", aiSignalTokenAllLiveData);
