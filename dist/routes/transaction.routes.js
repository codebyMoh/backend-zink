import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBody, validateParams } from '../middlewares/zod.js';
import { getreceiveTransaction, getSendTransaction, getTxForParticulerUser, searchTransactionByUsername, storeTransaction, } from '../controllers/transaction.controller.js';
import { getSendTransactionSchema, getTransactionForParticulerUser, searchTransactionByUserNameSchema, storeTransactionSchema, } from '../payloadValidation/transaction.validation.js';
import { authUser } from '../middlewares/userAuth.js';
const router = Router();
// store transactions
router.post('/addTransaction', asyncHandler(authUser), asyncHandler(validateBody(storeTransactionSchema)), asyncHandler(storeTransaction));
// get send transaction
router.get('/getSendTransaction/:page/:limit', asyncHandler(authUser), asyncHandler(validateParams(getSendTransactionSchema)), asyncHandler(getSendTransaction));
// get send transaction
router.get('/getreceiveTransaction/:page/:limit', asyncHandler(authUser), asyncHandler(validateParams(getSendTransactionSchema)), asyncHandler(getreceiveTransaction));
// search tx by user name
router.get('/searchTransactionByUsername/:search', asyncHandler(authUser), asyncHandler(validateParams(searchTransactionByUserNameSchema)), asyncHandler(searchTransactionByUsername));
// get transaction history for particuler user
router.get('/getTransactionsForTwoUser/:page/:limit/:id', asyncHandler(authUser), asyncHandler(validateParams(getTransactionForParticulerUser)), asyncHandler(getTxForParticulerUser));
export default router;
