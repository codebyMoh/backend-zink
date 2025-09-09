import { Router } from 'express';
import { addReferral, findUserBasedOnUsername, register, scanUserBasedOnUsername } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody, validateParams } from '../middlewares/zod.js';
import {
  addReferralSchema,
  findUserUsingUsernameSchema,
  registerSchema,
  scanUserUsingIdSchema,
} from '../payloadValidation/user.validation.js';
import { authUser } from '../middlewares/userAuth.js';

const router = Router();

// register
router.post(
  '/register',
  asyncHandler(validateBody(registerSchema)),
  asyncHandler(register),
);

// add referral
router.post(
  '/addReferral',
  asyncHandler(authUser),
  asyncHandler(validateBody(addReferralSchema)),
  asyncHandler(addReferral),
);
// scan user using _id
router.get(
  '/scanUser/:id',
  asyncHandler(authUser),
  asyncHandler(validateParams(scanUserUsingIdSchema)),
  asyncHandler(findUserBasedOnUsername),
);
// find user based on userName
router.get(
  '/findUser/:userName',
  asyncHandler(authUser),
  asyncHandler(validateParams(findUserUsingUsernameSchema)),
  asyncHandler(scanUserBasedOnUsername  ),
);

export default router;
