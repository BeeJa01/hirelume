function notFound(req, res) {
  res.status(404).json({ detail: 'Not found' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ detail: 'Invalid JSON body' });
  }
  if (error?.name === 'ZodError') {
    return res.status(422).json({ detail: error.issues.map((issue) => ({ loc: issue.path, msg: issue.message, type: issue.code })) });
  }
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ detail: 'CV_TOO_LARGE' });
  console.error(error);
  return res.status(500).json({ detail: 'Internal server error' });
}

module.exports = { notFound, errorHandler };