import mongoose, { Schema, Model } from 'mongoose';
import JWT from 'jsonwebtoken';
import config from '../config/env/index.js';
// 2️⃣ Schema definition
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    userName: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, index: true, default: null },
    walletAddressEVM: { type: String, unique: true },
    walletAddressSolana: { type: String, unique: true },
    smartWalletAddress: { type: String, unique: true },
    userIdAlchemy: { type: String },
    orgIdAlchemy: { type: String },
    referralId: { type: String, default: null, index: true, unique: true },
    referredBy: { type: Schema.Types.ObjectId, default: null, index: true },
    referredByone: { type: Schema.Types.ObjectId, default: null, index: true },
    referredByTwo: { type: Schema.Types.ObjectId, default: null, index: true },
    referredByThree: { type: Schema.Types.ObjectId, default: null },
    referredByFour: { type: Schema.Types.ObjectId, default: null },
    referredByFive: { type: Schema.Types.ObjectId, default: null },
    referredBySix: { type: Schema.Types.ObjectId, default: null },
    referredBySeven: { type: Schema.Types.ObjectId, default: null },
    referredByEight: { type: Schema.Types.ObjectId, default: null },
    referredByNine: { type: Schema.Types.ObjectId, default: null },
    referralAddedAt: { type: Date },
    active: { type: Boolean, default: false },
    lastLogin: { type: Date },
}, { timestamps: true });
// // 3️⃣ Middleware - hash password
// userSchema.pre('save', async function (next) {
//   const user = this as IUser;
//   if (!user.isModified('password')) return next();
//   user.password = await bcrypt.hash(user.password, 10);
//   next();
// });
// 4️⃣ Methods
// userSchema.methods.isPasswordCorrect = async function (
//   password: string,
// ): Promise<boolean> {
//   return bcrypt.compare(password, this.password);
// };
userSchema.methods.generateJWTToken = function (expiresIn = '1d') {
    const payload = {
        _id: this._id,
        email: this.email,
    };
    const options = {
        expiresIn: expiresIn,
    };
    return JWT.sign(payload, config.JWT_USER_SECRET, options);
};
// 5️⃣ Export model
const User = mongoose.model('User', userSchema);
export default User;
