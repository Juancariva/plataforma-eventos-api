import { usersDao } from '../dao/users.dao.js';

export const usersRepository = {
  findByEmail: async (email) => usersDao.findByEmail(email),
  create: async (userData) => usersDao.create(userData),
  getAll: async () => usersDao.getAll()
};
