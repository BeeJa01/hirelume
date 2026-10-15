const jwt = require("jsonwebtoken");
const { secretKey } = require("../config");
const { User } = require("../models");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(" ")[1], secretKey);
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    const code = expired ? "TOKEN_EXPIRED" : "UNAUTHORIZED";
    return res.status(401).json({
      success: false,
      error: {
        code,
        message: expired ? "Your session has expired." : "Authentication required.",
      },
    });
  }

  try {
    const userId = decoded.sub || decoded.id || decoded._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authenticate;
