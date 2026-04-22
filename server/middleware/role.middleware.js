// Usage: requireRole('admin') or requireRole('vet', 'admin')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Required: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { requireRole };