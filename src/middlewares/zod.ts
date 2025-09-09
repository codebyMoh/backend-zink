import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
declare module 'express-serve-static-core' {
  interface Request {
    validatedParams?: any;
  }
}
// validate body
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // ✅ strongly typed, safe body
    req.body = result.data as T;
    next();
  };
}

// validate params
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // ✅ strongly typed, safe params
    req.validatedParams = result.data as T;
    next();
  };
}
