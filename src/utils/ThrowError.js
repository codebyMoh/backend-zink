function ThrowError(statusCode = 500, message = "Interval server error.") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  throw error;
}

module.exports = ThrowError;
