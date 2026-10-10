import User from '../models/User.js';

export const usersDao = {
  findById: async (id) => User.findById(id).lean(),
  findOne: async (filter) => User.findOne(filter).lean(),
  create: async (userData) => User.create(userData),
  findAll: async () => User.find().lean()
};
