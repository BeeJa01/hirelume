function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: 'Not found.' },
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Invalid JSON body.' },
    });
  }
  if (error?.name === 'ZodError') {
    const details = {};
    for (const issue of error.issues) {
      const field = issue.path.length ? String(issue.path[0]) : '_form';
      details[field] ||= issue.message;
    }
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Please check your input and try again.', details },
    });
  }
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'The uploaded file is too large.' },
    });
  }
  console.error(error);
  return res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
  });
}

module.exports = { notFound, errorHandler };
