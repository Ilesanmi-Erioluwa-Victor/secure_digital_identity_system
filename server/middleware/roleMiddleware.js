const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Access denied. Required role: ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }
    next();
  };
};

module.exports = roleMiddleware;
