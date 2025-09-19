import mongoose, { Model, Schema } from 'mongoose';
import type { ITransaction } from '../constants/interfaces/model.interfaces.js';

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
      required: true,
    },
    userPaymentId: {
      type: String,
      index: true,
      required: true,
    },
    userName: {
      type: String,
      index: true,
      required: true,
    },
    recipientPaymentId: {
      type: String,
      index: true,
      required: true,
    },
    recipientUserName: {
      type: String,
      index: true,
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      index: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tx: { type: String, required: true },
    message: { type: String, default: null },
    type: {
      type: String,
      required: true,
    },
    requestFullFilled: { type: Boolean, default: false },
    recipientAddress: {
      type: String,
      required: true,
    },
    chatMessage: {
      type: String,
    },
    currency: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema,
);

export default Transaction;
