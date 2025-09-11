import User from '../models/user.model.js';
import { code } from '../constants/code.js';
import { ThrowError } from '../utils/ThrowError.js';
import Transaction from '../models/transaction.model.js';
import { apiResponse } from '../utils/apiResponse.js';
// store transactions
export async function storeTransaction(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token.)');
    }
    const { recipientId, amount, tx, currency } = req.body;
    //   find recipient
    const recipientUser = await User.findById(recipientId).select('_id walletAddressEVM userName');
    if (!recipientUser) {
        return ThrowError(code.BAD_REQUEST, 'Invalid recipient.');
    }
    // store transaction
    const transaction = await Transaction.create({
        userId: user?._id,
        recipientId: recipientUser?._id,
        recipientUserName: recipientUser?.userName,
        userName: user?.userName,
        amount: Number(amount),
        tx: tx,
        recipientAddress: recipientUser?.walletAddressEVM,
        currency: currency,
    });
    if (!transaction) {
        return ThrowError(code.INTERNAL_SERVER_ERROR, 'Internal server error(Store transaction).');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction added.', {
        transaction,
    });
}
// get send transaction
export async function getSendTransaction(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token.)');
    }
    const { page, limit } = req.validatedParams;
    const skip = (page - 1) * limit;
    // get transaction data
    const transactions = await Transaction.find({ userId: user?._id })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
    if (transactions?.length == 0) {
        return ThrowError(code.NOT_FOUND, 'Transaction not found.');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction fetched.', {
        transactions,
    });
}
// get send transaction
export async function getreceiveTransaction(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token.)');
    }
    const { page, limit } = req.validatedParams;
    const skip = (page - 1) * limit;
    // get transaction data
    const transactions = await Transaction.find({ recipientId: user?._id })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
    if (transactions?.length == 0) {
        return ThrowError(code.NOT_FOUND, 'Transaction not found.');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction fetched.', {
        transactions,
    });
}
// search transaction by username
export async function searchTransactionByUsername(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token).');
    }
    const { search } = req.validatedParams;
    const regex = new RegExp(`^${search}`, 'i');
    const transactions = await Transaction.find({
        $and: [
            {
                $or: [{ userId: user?._id }, { recipientId: user?._id }],
            },
            {
                $or: [
                    { userName: { $regex: regex } },
                    { recipientUserName: { $regex: regex } },
                ],
            },
        ],
    });
    if (transactions?.length == 0) {
        return ThrowError(code.NOT_FOUND, 'No transactions found.');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction found.', {
        transactions,
    });
}
