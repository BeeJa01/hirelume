function authorize(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ detail: 'You do not have access to this resource' });
    }
    next();
  };
}

module.exports = { authorize };
