function notFound(req, res) {
  res.status(404).json({ detail: 'ROUTE_NOT_FOUND' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ detail: 'INVALID_JSON' });
  }
  if (error?.name === 'ZodError') {
    return res.status(422).json({ detail: 'VALIDATION_ERROR', errors: error.issues.map((issue) => ({ loc: issue.path, msg: issue.message, type: issue.code })) });
  }
  if (error?.code === 'LIMIT_FILE_SIZE') {
    const detail = req.baseUrl === '/api/users' ? 'AVATAR_TOO_LARGE' : 'CV_TOO_LARGE';
    return res.status(413).json({ detail });
  }
  if (error?.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ detail: 'UNEXPECTED_FILE' });
  console.error(error);
  return res.status(500).json({ detail: 'INTERNAL_SERVER_ERROR' });
}

module.exports = { notFound, errorHandler };
