import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  // Support both 'token' header and 'Authorization: Bearer' format
  const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');

  console.log('Auth middleware: checking token for', req.path);
  console.log('Token present:', !!token);

  if (!token) {
    return res.json({
      success: false,
      message: "Authentication required. Please login.",
    });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = token_decode.id; // Attach to req.userId for consistency
    req.body.userId = token_decode.id; // Keep for backward compatibility
    next();
  } catch (e) {
    res.json({ 
      success: false, 
      message: "Invalid authentication token. Please login again." 
    });
  }
};

export default authUser;
