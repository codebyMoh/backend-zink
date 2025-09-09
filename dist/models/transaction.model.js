import mongoose, { Model, Schema } from 'mongoose';
const transactionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true,
        required: true,
    },
    recipientId: {
        type: Schema.Types.ObjectId,
        default: null,
        index: true,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    tx: { type: String, required: true },
    recipientAddress: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
