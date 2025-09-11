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
export const searchTransactionByUserNameSchema = zod.object({
    search: zod.string().min(1, 'Page is required.'),
});
