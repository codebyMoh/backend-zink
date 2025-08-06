const { code } = require("../../constant/code");

function asyncHandler(fun) {
  return async function (req, res, next) {
    try {
      // call the function
      await fun(req, res, next);
    } catch (error) {
      console.log("🚀 ~ Async handler logs=====>", error?.message);
      if (error.code === 11000) {
        return res.status(code.NOT_ALLOWED).send({
          statusCode: code.NOT_ALLOWED,
          success: false,
          message: "Duplicates are not allowed..",
          data: {},
        });
      } else if (
        error?.message == "jwt expired" ||
        error?.message == "invalid token" ||
        error?.message == "invalid signature"
      ) {
        return res.status(code.UNAUTHORIZED).send({
          statusCode: code.UNAUTHORIZED,
          success: false,
          message: "Unauthorized request.",
          data: {},
        });
      } else {
        return res.status(error?.statusCode || 500).send({
          statusCode: error?.statusCode || 500,
          success: false,
          message: error?.message || "Inerval server error.",
          data: {},
        });
      }
    }
  };
}

module.exports = { asyncHandler };
