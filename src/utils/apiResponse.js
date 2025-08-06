function apiResponse(res, code = 200, msg = "success", data) {
  return res.status(code).send({
    statusCode: code,
    success: true,
    message: msg,
    data: data,
  });
}
module.exports = { apiResponse };
