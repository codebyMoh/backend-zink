import type { NextFunction, Request, Response } from 'express';
import User from '../models/user.model.js';
import { code } from '../constants/code.js';
import { ThrowError } from '../utils/ThrowError.js';
import Transaction from '../models/transaction.model.js';
import { apiResponse } from '../utils/apiResponse.js';

// store transactions
export async function storeTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token.)',
    );
  }
  const { recipientId, amount, tx, currency, message } = req.body;
  //   find recipient
  const recipientUser = await User.findById(recipientId).select(
    '_id walletAddressEVM paymentId userName',
  );
  if (!recipientUser) {
    return ThrowError(code.BAD_REQUEST, 'Invalid recipient.');
  }
  // store transaction
  const transaction = await Transaction.create({
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
  });
  if (!transaction) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      'Internal server error(Store transaction).',
    );
  }
  return apiResponse(res, code.SUCCESS, 'Transaction added.', {
    transaction,
  });
}

// get single transaction by _id
export async function getSingleTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token.)',
    );
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
export async function getSendTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token.)',
    );
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
export async function getreceiveTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token.)',
    );
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

// get tx for particuler user
export async function getTxForParticulerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token.)',
    );
  }
  const { page, limit, id } = req.validatedParams;
  if (user?._id == id) {
    return ThrowError(code.BAD_REQUEST, 'You can not pass user own id.');
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
  const sortedTransaction = transactions.sort(
    (a, b) =>
      new Date(a.createdAt as any).getTime() -
      new Date(b.createdAt as any).getTime(),
  );
  return apiResponse(res, code.SUCCESS, 'Transaction fetched.', {
    transactions: sortedTransaction,
  });
}

// search transaction by username
export async function searchTransactionByUsername(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token).',
    );
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
export async function getRecentTransaction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.BAD_REQUEST,
      'Unauthorized request(user not found from token).',
    );
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
