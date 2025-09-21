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
    const { recipientId, amount, tx, currency, message, type, chatMessage, requestSuccessId, } = req.body;
    if (type == 'request_payment_success') {
        if (!requestSuccessId?.toString().trim()) {
            return ThrowError(code.BAD_REQUEST, 'requestSuccessId is required.');
        }
        const updateRequestPayment = await Transaction.findByIdAndUpdate(requestSuccessId, {
            $set: {
                tx: tx,
                requestFullFilled: true,
            },
        }, {
            new: true,
        });
        if (!updateRequestPayment) {
            return ThrowError(code.INTERNAL_SERVER_ERROR, 'Internal server error(Updating request payment).');
        }
        return apiResponse(res, code.SUCCESS, 'Transaction updated.', {
            transaction: updateRequestPayment,
        });
    }
    //   find recipient
    const recipientUser = await User.findById(recipientId).select('_id walletAddressEVM paymentId userName');
    if (!recipientUser) {
        return ThrowError(code.BAD_REQUEST, 'Invalid recipient.');
    }
    let transaction = null;
    // store transaction
    if (type == 'tx') {
        transaction = await Transaction.create({
            userId: user?._id,
            recipientId: recipientUser?._id,
            userPaymentId: user?.paymentId,
            userName: user?.userName,
            recipientPaymentId: recipientUser?.paymentId,
            recipientUserName: recipientUser?.userName,
            amount: Number(amount),
            tx: tx,
            recipientAddress: recipientUser?.walletAddressEVM,
            currency: currency,
            message: message ? message : 'Money sent.',
            type: type,
        });
    }
    else if (type == 'chat') {
        if (!chatMessage?.toString().trim()) {
            return ThrowError(code.BAD_REQUEST, 'Chat message is requied.');
        }
        transaction = await Transaction.create({
            userId: user?._id,
            recipientId: recipientUser?._id,
            userPaymentId: user?.paymentId,
            userName: user?.userName,
            recipientPaymentId: recipientUser?.paymentId,
            recipientUserName: recipientUser?.userName,
            amount: Number(1),
            tx: 'chat message',
            recipientAddress: recipientUser?.walletAddressEVM,
            currency: 'chat message',
            message: 'chat message',
            type: type,
            chatMessage: chatMessage,
        });
    }
    else if (type == 'request_payment') {
        transaction = await Transaction.create({
            userId: user?._id,
            recipientId: recipientUser?._id,
            userPaymentId: user?.paymentId,
            userName: user?.userName,
            recipientPaymentId: recipientUser?.paymentId,
            recipientUserName: recipientUser?.userName,
            amount: Number(amount),
            tx: 'request_payment',
            recipientAddress: recipientUser?.walletAddressEVM,
            currency: currency,
            message: message ? message : 'Request for money.',
            type: type,
            requestFullFilled: false,
        });
    }
    if (!transaction) {
        return ThrowError(code.INTERNAL_SERVER_ERROR, 'Internal server error(Store transaction).');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction added.', {
        transaction,
    });
}
// decline request payment
export async function declineReqPayment(req, res, next) {
    const { txId } = req.validatedParams;
    const findTransaction = await Transaction.findByIdAndUpdate(txId, {
        $set: {
            isDeclined: true,
        },
    }, { new: true });
    if (!findTransaction?._id) {
        return ThrowError(code.INTERNAL_SERVER_ERROR, 'Internal server error(Updating tx).');
    }
    return apiResponse(res, code.SUCCESS, 'Request decline.', {});
}
// get single transaction by _id
export async function getSingleTransaction(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token.)');
    }
    const { id } = req.validatedParams;
    const findTransaction = await Transaction.findById(id);
    if (findTransaction?._id) {
        return ThrowError(code.NOT_FOUND, 'Transaction not found.');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction fetched.', {
        transaction: findTransaction,
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
    const transactions = await Transaction.find({ userId: user?._id, type: 'tx' })
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
    const transactions = await Transaction.find({
        recipientId: user?._id,
        type: 'tx',
    })
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
// get tx for particuler user
export async function getTxForParticulerUser(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token.)');
    }
    const { page, limit, id } = req.validatedParams;
    if (user?._id == id) {
        return ThrowError(code.BAD_REQUEST, 'You can not pass user own id.');
    }
    const recipientuserDetails = await User.findById(id).select('_id email paymentId userName walletAddressEVM smartWalletAddress');
    if (!recipientuserDetails?._id) {
        return ThrowError(code.BAD_REQUEST, 'Recipient user not found.');
    }
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find({
        $or: [
            { userId: user._id, recipientId: id },
            { userId: id, recipientId: user._id },
        ],
    })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
    if (transactions?.length == 0) {
        return ThrowError(code.NOT_FOUND, 'Transaction not found.');
    }
    const sortedTransaction = transactions.sort((a, b) => new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime());
    return apiResponse(res, code.SUCCESS, 'Transaction fetched.', {
        transactions: sortedTransaction,
        recipientuser: recipientuserDetails,
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
                type: 'tx',
            },
            {
                $or: [{ userId: user?._id }, { recipientId: user?._id }],
            },
            {
                $or: [
                    { userPaymentId: { $regex: regex } },
                    { recipientPaymentId: { $regex: regex } },
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
// get recent transaction
export async function getRecentTransaction(req, res, next) {
    const user = req.user;
    if (!user?._id) {
        return ThrowError(code.BAD_REQUEST, 'Unauthorized request(user not found from token).');
    }
    const transactions = await Transaction.aggregate([
        {
            $match: {
                $or: [{ recipientId: user._id }, { userId: user._id }],
            },
        },
        {
            $sort: { _id: -1 },
        },
        {
            $group: {
                _id: {
                    $cond: {
                        if: { $eq: ['$userId', user._id] },
                        then: '$recipientId',
                        else: '$userId',
                    },
                },
                latestTransaction: { $first: '$$ROOT' },
            },
        },
        {
            $replaceRoot: { newRoot: '$latestTransaction' },
        },
        {
            $limit: 30,
        },
        {
            $project: {
                _id: 1,
                userName: 1,
                userId: 1,
                recipientId: 1,
                recipientUserName: 1,
            },
        },
    ]);
    if (transactions?.length == 0) {
        return ThrowError(code.NOT_FOUND, 'No transaction found.');
    }
    return apiResponse(res, code.SUCCESS, 'Transaction found.', {
        transactions,
    });
}
