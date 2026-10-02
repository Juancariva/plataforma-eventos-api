import User from '../models/User.js';

export const usersDao = {
  findByEmail: async (email) => User.findOne({ email }),
  create: async (userData) => User.create(userData)
};
