import { code } from '../constants/code.js';
export function apiResponse(res, statusCode = code.SUCCESS, msg = 'success', data) {
    return res.status(statusCode).send({
        statusCode,
        success: true,
        message: msg,
        data,
    });
}
