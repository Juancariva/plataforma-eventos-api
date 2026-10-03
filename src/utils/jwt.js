import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

const ensureJwtSecret = () => {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET no configurado');
  }
};

export const generateToken = (payload) => (
  ensureJwtSecret() || jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  })
);

export const verifyToken = (token) => {
  ensureJwtSecret();
  return jwt.verify(token, env.jwtSecret);
};
