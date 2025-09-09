// custom-error.ts

export class CustomError extends Error {
  statusCode: number;
  success: boolean;

  constructor(statusCode = 500, message = 'Internal server error.') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;

    // Fix prototype chain (important for `instanceof` to work in TS)
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export function ThrowError(
  statusCode = 500,
  message = 'Internal server error.',
): never {
  throw new CustomError(statusCode, message);
}
