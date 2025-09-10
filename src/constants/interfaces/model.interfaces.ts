import type mongoose from 'mongoose';

// 1️⃣ Define the interface for User document (all fields + methods)
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  userName: string;
  walletAddressEVM?: string;
  walletAddressSolana?: string;
  smartWalletAddress?: string;
  orgIdAlchemy: String;
  userIdAlchemy: String;
  referralId?: string | null;
  referredBy?: mongoose.Types.ObjectId | null;
  referredByone?: mongoose.Types.ObjectId | null;
  referredByTwo?: mongoose.Types.ObjectId | null;
  referredByThree?: mongoose.Types.ObjectId | null;
  referredByFour?: mongoose.Types.ObjectId | null;
  referredByFive?: mongoose.Types.ObjectId | null;
  referredBySix?: mongoose.Types.ObjectId | null;
  referredBySeven?: mongoose.Types.ObjectId | null;
  referredByEight?: mongoose.Types.ObjectId | null;
  referredByNine?: mongoose.Types.ObjectId | null;
  referralAddedAt?: Date;
  lastLogin?: Date;
  active: Boolean;
  // methods
  generateJWTToken(expiresIn: string | number): string;
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId | null;
  recipientId: mongoose.Types.ObjectId | null;
  recipientUserName: string;
  userName: string;
  tx: string;
  amount: number;
  recipientAddress: string;
  currency: string;
}
