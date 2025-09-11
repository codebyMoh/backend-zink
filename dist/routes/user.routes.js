import { Router } from 'express';
import { addReferral, addUserFullName, findUserBasedOnUsername, register, scanUserBasedOnID, searchUserByUserName, } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody, validateParams } from '../middlewares/zod.js';
import { addReferralSchema, addUserNameSchema, findUserUsingUsernameSchema, registerSchema, scanUserUsingIdSchema, searchUserUsingUsernameSchema, } from '../payloadValidation/user.validation.js';
import { authUser } from '../middlewares/userAuth.js';
const router = Router();
// register
router.post('/register', asyncHandler(validateBody(registerSchema)), asyncHandler(register));
router.put('/addFullName', asyncHandler(authUser), asyncHandler(validateBody(addUserNameSchema)), asyncHandler(addUserFullName));
// add referral
router.post('/addReferral', asyncHandler(authUser), asyncHandler(validateBody(addReferralSchema)), asyncHandler(addReferral));
// scan user using _id
router.get('/scanUser/:id', asyncHandler(authUser), asyncHandler(validateParams(scanUserUsingIdSchema)), asyncHandler(scanUserBasedOnID));
// find user based on userName
router.get('/findUser/:userName', asyncHandler(authUser), asyncHandler(validateParams(findUserUsingUsernameSchema)), asyncHandler(findUserBasedOnUsername));
// search user based on the username
router.get('/searchUserByUserName/:search', asyncHandler(authUser), asyncHandler(validateParams(searchUserUsingUsernameSchema)), asyncHandler(searchUserByUserName));
export default router;
