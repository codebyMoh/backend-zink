import zod from 'zod';
// register schema
export const registerSchema = zod.object({
  email: zod
    .string()
    .min(1, 'Email is required.')
    .email('Invalid email address.'),
  addressEvm: zod
    .string()
    .min(1, 'EVM address is required.')
    .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), {
      message: 'Invalid EVM address',
    }),
  addressSolana: zod
    .string()
    .min(1, 'solana address is required.')
    .refine((val) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val), {
      message: 'Invalid Solana address',
    }),
  smartWalletAddress: zod
    .string()
    .min(1, 'Smart wallet address is required.')
    .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), {
      message: 'Invalid smart wallet address',
    }),
  userId: zod.string().min(1, 'alchemy userid is required.'),
  orgId: zod.string().min(1, 'alchemy orgid is required.'),
  // fullName: zod.string().min(3, 'fullname is required.'),
});

// add referral
export const addReferralSchema = zod.object({
  inviteCode: zod
    .string()
    .min(10, 'Min 10 characters required..')
    .max(15, 'You can only add max 15 characters.'),
});
// find user by username
export const findUserUsingUsernameSchema = zod.object({
  userName: zod
    .string()
    .min(8, 'Min 8 characters required.')
    .max(30, 'You can only add max 30 characters.'),
});
// search user by username
export const searchUserUsingUsernameSchema = zod.object({
  search: zod
    .string()
    .min(3, 'Min 3 characters required.')
    .max(30, 'You can only add max 30 characters.'),
});
// scan user using ID
export const scanUserUsingIdSchema = zod.object({
  id: zod
    .string()
    .min(20, 'Min 8 characters required.')
    .max(50, 'You can only add max 50 characters.'),
});
// set full name
export const addUserNameSchema = zod.object({
  fullName: zod
    .string()
    .min(3, 'Min 3 characters required.')
    .max(15, 'You can only add max 15 characters.'),
});
export const editPaymentidSchema = zod.object({
  paymentId: zod
    .string()
    .min(6, 'Min 6 characters required.')
    .max(20, 'You can only add max 12 characters.'),
});
