import { usersRepository } from '../repositories/users.repository.js';

export const usersService = {
  findByEmail: async (email) => usersRepository.findByEmail(email),
  create: async (userData) => usersRepository.create(userData)
};
