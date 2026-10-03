import passport from 'passport';

export const authenticateStrategy = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (error, user, info) => {
    if (error) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Error interno del servidor'
      });
    }

    if (!user) {
      return res.status(info?.statusCode || 401).json({
        status: 'error',
        message: info?.message || 'No autenticado'
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
};
