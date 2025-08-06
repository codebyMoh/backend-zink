const { default: mongoose } = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    contract_address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = (db) => db.model("addressAiSignle", addressSchema);
