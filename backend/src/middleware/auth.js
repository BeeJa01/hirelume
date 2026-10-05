const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { secretKey } = require("../config");

/**
 * Authenticate requests using a JWT access token.
 *
 * The token contains the user's MongoDB ID in the `sub` claim.
 * After verifying the token, we load the current user from MongoDB
 * so other middleware can access fields such as role and email.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify that the token was created using our configured secret.
    const decoded = jwt.verify(token, secretKey);

    // The login controller stores the user's MongoDB ID in the
    // JWT "sub" (subject) claim.
    if (!decoded.sub) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // Load the current user so role-based middleware can use
    // req.user.role and other user information.
    const user = await User.findById(decoded.sub).select(
      "-password_hash"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.name,
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authenticate;