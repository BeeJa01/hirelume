function authorize(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ detail: 'FORBIDDEN' });
    }
    next();
  };
}

module.exports = { authorize };
