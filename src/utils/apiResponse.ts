import type { Response } from 'express';
import { code } from '../constants/code.js';

export function apiResponse<T>(
  res: Response,
  statusCode: number = code.SUCCESS,
  msg: string = 'success',
  data?: T,
) {
  return res.status(statusCode).send({
    statusCode,
    success: true,
    message: msg,
    data,
  });
}
