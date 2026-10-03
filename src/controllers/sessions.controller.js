import { env } from '../config/env.config.js';
import { generateToken } from '../utils/jwt.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 3600000,
  secure: env.nodeEnv === 'production'
};

const clearCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production'
};

export const getSessions = (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: []
  });
};

export const register = async (req, res) => {
  res.status(201).json({
    status: 'success',
    payload: req.user
  });
};

export const login = async (req, res) => {
  try {
    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    res
      .cookie('currentUser', token, cookieOptions)
      .status(200)
      .json({
        status: 'success',
        message: 'Login correcto'
      });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Error interno del servidor'
    });
  }
};

export const current = (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
};

export const logout = (req, res) => {
  res
    .clearCookie('currentUser', clearCookieOptions)
    .status(200)
    .json({
      status: 'success',
      message: 'Sesión cerrada'
    });
};
