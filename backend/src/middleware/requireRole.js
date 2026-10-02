const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        message: "Recruiter access required",
      });
    }

    next();
  };
};

module.exports = requireRole;
