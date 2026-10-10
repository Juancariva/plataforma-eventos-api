import passport from 'passport';

export const authenticateStrategy = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, {
    session: false,
    badRequestMessage: strategy === 'register'
      ? 'Faltan campos obligatorios'
      : 'Credenciales inválidas'
  }, (error, user, info, status) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      const statusCode = info?.statusCode || (strategy === 'register' ? status || 400 : 401);

      return res.status(statusCode).json({
        status: 'error',
        message: strategy === 'current' ? 'No autenticado' : info?.message || 'No autenticado'
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
};
