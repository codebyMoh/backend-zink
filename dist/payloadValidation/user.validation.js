import zod from 'zod';
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
export const addReferralSchema = zod.object({
    inviteCode: zod.string().min(1, 'Invitecode is required.'),
});
export const findUserUsingUsernameSchema = zod.object({
    userName: zod.string().min(8, 'Invalid username.'),
});
export const searchUserUsingUsernameSchema = zod.object({
    search: zod.string().min(3, 'Invalid username.'),
});
export const scanUserUsingIdSchema = zod.object({
    id: zod.string().min(8, 'Invalid user.'),
});
