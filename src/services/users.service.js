import { usersRepository } from '../repositories/users.repository.js';

const userResponse = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
});

export const usersService = {
  findByEmail: async (email) => usersRepository.findByEmail(email),
  create: async (userData) => usersRepository.create(userData),
  getAll: async () => {
    const users = await usersRepository.getAll();
    return users.map(userResponse);
  }
};
