import type { Request, Response, NextFunction } from 'express';
import User from '../models/user.model.js';
import { ThrowError } from '../utils/ThrowError.js';
import { code } from '../constants/code.js';
import { apiResponse } from '../utils/apiResponse.js';

// register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const {
    email,
    addressEvm,
    addressSolana,
    smartWalletAddress,
    userId,
    orgId,
  } = req.body;
  // check user is exist or not.
  const isUserExist = await User.findOne({ email: email });
  if (isUserExist) {
    const token = await isUserExist?.generateJWTToken('30d');
    if (!token) {
      return ThrowError(
        code.INTERNAL_SERVER_ERROR,
        'Internal server error (Token generation).',
      );
    }
    return apiResponse(res, code.SUCCESS, 'User login successfull.', {
      user: {
        _id: isUserExist?._id,
        email: isUserExist?.email,
        userName: isUserExist?.userName,
        addressSolana: isUserExist?.walletAddressSolana,
        addressEVM: isUserExist?.walletAddressEVM,
        smartWalletAddress: isUserExist?.smartWalletAddress,
        active: isUserExist?.active,
      },
      token,
    });
  }
  // generate referralId
  const referralId = `${addressEvm?.slice(0, 6) + addressSolana?.slice(-6)}`;
  if (!referralId) {
    return ThrowError(code.BAD_REQUEST, 'ReferralId.');
  }
  // generateUserName
  const emailFirst = email?.split('@')[0];
  if (!emailFirst) {
    return ThrowError(code.BAD_REQUEST, 'Email first half.');
  }
  const userName = `${emailFirst}${referralId}.zink`;
  if (!userName) {
    return ThrowError(code.BAD_REQUEST, 'Username.');
  }
  // store user in DB
  const user = await User.create({
    email: email,
    walletAddressEVM: addressEvm,
    walletAddressSolana: addressSolana,
    smartWalletAddress: smartWalletAddress,
    userIdAlchemy: userId,
    orgIdAlchemy: orgId,
    referralId: referralId,
    userName: userName,
    lastLogin: new Date(),
    active: true,
  });
  if (!user) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      'Internal server error (creating user).',
    );
  }
  const token = await user?.generateJWTToken('30d');
  if (!token) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      'Internal server error (Token generation).',
    );
  }
  return apiResponse(res, code.SUCCESS, 'User login successfully.', {
    user: {
      _id: user?._id,
      email: user?.email,
      userName: user?.userName,
      addressSolana: user?.walletAddressSolana,
      addressEVM: user?.walletAddressEVM,
      smartWalletAddress: user?.smartWalletAddress,
      active: user?.active,
    },
    token,
  });
}

// add referral
export async function addReferral(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = req.user;
  if (!user?._id) {
    return ThrowError(
      code.UNAUTHORIZED,
      'Unauthorized request(user not found from token.)',
    );
  }
  if (user?.referredBy) {
    return ThrowError(code.BAD_REQUEST, 'Invitecode already added.');
  }
  const { inviteCode } = req.body;
  // find user using invitecode
  const inviteUser = await User.findOne({ referralId: inviteCode });
  if (!inviteUser) {
    return ThrowError(code.BAD_REQUEST, 'Invalid invite code.');
  }
  if (inviteUser?._id?.toString() == user?._id?.toString()) {
    return ThrowError(code.BAD_REQUEST, 'You cannot add your own invite code.');
  }
  // update user
  const updateUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        referredBy: inviteUser?._id,
        referredByone: inviteUser?.referredBy || null,
        referredByTwo: inviteUser?.referredByone || null,
        referredByThree: inviteUser?.referredByTwo || null,
        referredByFour: inviteUser?.referredByThree || null,
        referredByFive: inviteUser?.referredByFour || null,
        referredBySix: inviteUser?.referredByFive || null,
        referredBySeven: inviteUser?.referredBySix || null,
        referredByEight: inviteUser?.referredBySeven || null,
        referredByNine: inviteUser?.referredByEight || null,
        referralAddedAt: new Date(),
      },
    },
    { new: true },
  );
  if (!updateUser) {
    return ThrowError(
      code.INTERNAL_SERVER_ERROR,
      'Internal server error(updation).',
    );
  }
  return apiResponse(res, code.SUCCESS, 'Referral added successfully.', {});
}

// find user based on username
export async function findUserBasedOnUsername(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userName } = req.validatedParams;
  const findUser = await User.findOne({ userName }).select(
    'name email userName walletAddressEVM userIdAlchemy',
  );
  if (!findUser) {
    return ThrowError(code.UNAUTHORIZED, 'User not found.');
  }
  return apiResponse(res, code.SUCCESS, 'User found.', {
    user: findUser,
  });
}

// search user using username
export async function searchUserByUserName(
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
  const users = await User.find({ userName: { $regex: regex } }).select(
    '_id email userName walletAddressEVM smartWalletAddress active',
  );
  if (users?.length == 0) {
    return ThrowError(code.NOT_FOUND, 'No user found.');
  }
  return apiResponse(res, code.SUCCESS, 'Users found.', {
    users,
  });
}

//scan user based on id
export async function scanUserBasedOnID(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.validatedParams;
  const findUser = await User.findById(id).select(
    'name email userName walletAddressEVM userIdAlchemy smartWalletAddress',
  );
  if (!findUser) {
    return ThrowError(code.UNAUTHORIZED, 'User not found.');
  }
  if (findUser?._id?.toString() == id) {
    return ThrowError(code.NOT_ALLOWED, 'This is your own qr code.');
  }
  return apiResponse(res, code.SUCCESS, 'User found.', {
    user: findUser,
  });
}
