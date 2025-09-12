import jwt from 'jsonwebtoken';
import { ThrowError } from '../utils/ThrowError.js';
import { code } from '../constants/code.js';
import User from '../models/user.model.js';
const JWT_SECRET = process.env.JWT_USER_SECRET;
export async function authUser(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return ThrowError(code.UNAUTHORIZED, 'Unauthorized request');
        }
        // decode token
        const decodedToken = jwt.verify(token, JWT_SECRET);
        if (!decodedToken || !decodedToken._id) {
            return ThrowError(code.UNAUTHORIZED, 'Unauthorized request');
        }
        // check user exist or not
        const isUserExist = await User.findById(decodedToken._id);
        if (!isUserExist) {
            return ThrowError(code.UNAUTHORIZED, 'Unauthorized request');
        }
        if (!isUserExist.active) {
            return ThrowError(code.UNAUTHORIZED, 'Unauthorized request (User deactivated.)');
        }
        // Attach user to request object
        req.user = isUserExist;
        next();
    }
    catch (error) {
        return ThrowError(code.UNAUTHORIZED, 'Unauthorized request');
    }
}
