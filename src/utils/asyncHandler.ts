import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { code } from '../constants/code.js';

// A wrapper to catch async errors
export function asyncHandler(fun: RequestHandler): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await Promise.resolve(fun(req, res, next));
    } catch (error: any) {
      console.log('🚀 ~ Async handler logs=====>', error?.message);

      if (error.code === 11000) {
        res.status(code.NOT_ALLOWED).send({
          statusCode: code.NOT_ALLOWED,
          success: false,
          message: error?.message || 'Duplicates are not allowed..',
          data: {},
        });
      } else if (
        error?.message === 'jwt expired' ||
        error?.message === 'invalid token' ||
        error?.message === 'invalid signature'
      ) {
        res.status(code.UNAUTHORIZED).send({
          statusCode: code.UNAUTHORIZED,
          success: false,
          message: 'Unauthorized request.',
          data: {},
        });
      } else {
        res.status(error?.statusCode || 500).send({
          statusCode: error?.statusCode || 500,
          success: false,
          message: error?.message || 'Internal server error.',
          data: {},
        });
      }
    }
  };
}
