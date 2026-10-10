import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { env } from './env.config.js';
import { usersService } from '../services/users.service.js';

const handleStrategyError = (error, done) => {
  if (error.statusCode && error.statusCode < 500) {
    return done(null, false, {
      message: error.message,
      statusCode: error.statusCode
    });
  }

  return done(error);
};

const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
};

const registerStrategy = new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    return done(null, await usersService.register(req.body || {}));
  } catch (error) {
    return handleStrategyError(error, done);
  }
});

const loginStrategy = new LocalStrategy(localOptions, async (req, email, password, done) => {
  try {
    return done(null, await usersService.authenticate(req.body || {}));
  } catch (error) {
    return handleStrategyError(error, done);
  }
});

const currentStrategy = new JwtStrategy({
  jwtFromRequest: (req) => req.cookies?.currentUser || null,
  secretOrKey: env.jwtSecret
}, (payload, done) => (
  done(null, usersService.getCurrent(payload))
));

export const initializePassport = () => {
  passport.use('register', registerStrategy);
  passport.use('login', loginStrategy);
  passport.use('current', currentStrategy);
};
