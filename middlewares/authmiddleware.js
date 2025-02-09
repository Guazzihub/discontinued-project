// middlewares/authmiddleware.js

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = req.session;
    return next();
  }
  res.redirect('/auth/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).render('403', { 
    message: 'Access denied: admin only.',
    user: req.session 
  });
};
