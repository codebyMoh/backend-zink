import zod from 'zod';

// store transactions
export const storeTransactionSchema = zod.object({
  recipientId: zod.string().min(1, 'RecipientId is required.'),
  amount: zod.number().gt(0, 'Amount is required.'),
  tx: zod.string().min(1, 'Tx hash is required.'),
  currency: zod.string().min(1, 'Currency is required.'),
});
// getSendTransaction schema
export const getSendTransactionSchema = zod.object({
  page: zod.string().min(1, 'Page is required.'),
  limit: zod.string().min(1, 'Limit is required.'),
});
// get transaction by _id
export const getSingleTransactionSchema = zod.object({
  id: zod
    .string()
    .min(20, 'Min 20 characters required.')
    .max(50, 'You can only add max 50 characters.'),
});
// search tx by usser name
export const searchTransactionByUserNameSchema = zod.object({
  search: zod
    .string()
    .min(3, 'Min 3 characters required.')
    .max(30, 'You can only add max 30 characters.'),
});
// get transaction for particuler user
export const getTransactionForParticulerUser = zod.object({
  page: zod.string().min(1, 'Page is required.'),
  limit: zod.string().min(1, 'Limit is required.'),
  id: zod.string().min(1, 'userId is required.'),
});
