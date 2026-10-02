import { registerUser } from '../services/sessions.service.js';

export const getSessions = (req, res) => {
  res.status(200).json({
    status: 'success',
    payload: []
  });
};

export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      status: 'success',
      payload: user
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Error interno del servidor'
    });
  }
};
