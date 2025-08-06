const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const JWT_SECRATE = process.env.JWT_ADMIN_SECRET;
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// bcrypt password before save to the db
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// compare password
adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// generate JWT
adminSchema.methods.generateJWTToken = async function (ex) {
  return JWT.sign(
    {
      _id: this._id,
      email: this.email,
    },
    JWT_SECRATE,
    { expiresIn: ex }
  );
};

module.exports = (db) => db.model("adminuser", adminSchema);
