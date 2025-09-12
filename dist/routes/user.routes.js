import { Router } from 'express';
import { addReferral, addUserFullName, editPayemtnId, findUserByPaymentId, register, scanUserBasedOnID, searchUserByUserName, } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody, validateParams } from '../middlewares/zod.js';
import { addReferralSchema, addUserNameSchema, editPaymentidSchema, findUserUsingUsernameSchema, registerSchema, scanUserUsingIdSchema, searchUserUsingUsernameSchema, } from '../payloadValidation/user.validation.js';
import { authUser } from '../middlewares/userAuth.js';
const router = Router();
// register
router.post('/register', asyncHandler(validateBody(registerSchema)), asyncHandler(register));
// add full name
router.put('/addFullName', asyncHandler(authUser), asyncHandler(validateBody(addUserNameSchema)), asyncHandler(addUserFullName));
// edit paymentId for once
router.put('/editPaymentId', asyncHandler(authUser), asyncHandler(validateBody(editPaymentidSchema)), asyncHandler(editPayemtnId));
// add referral
router.post('/addReferral', asyncHandler(authUser), asyncHandler(validateBody(addReferralSchema)), asyncHandler(addReferral));
// scan user using _id
router.get('/scanUser/:id', asyncHandler(authUser), asyncHandler(validateParams(scanUserUsingIdSchema)), asyncHandler(scanUserBasedOnID));
// find user based on paymentId
router.get('/findUser/:paymentId', asyncHandler(authUser), asyncHandler(validateParams(findUserUsingUsernameSchema)), asyncHandler(findUserByPaymentId));
// search user based on the username
router.get('/searchUserByUserName/:search', asyncHandler(authUser), asyncHandler(validateParams(searchUserUsingUsernameSchema)), asyncHandler(searchUserByUserName));
export default router;
