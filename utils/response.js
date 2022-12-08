function sendError(res, message, statusCode) {
  res.status(statusCode).json({ error: message });
}

function sendSuccess(res, message, statusCode) {
  res.status(statusCode).json({ ...message });
}

module.exports = {
  sendError,
  sendSuccess,
};
