import { usersDao } from '../dao/users.dao.js';
import UserDTO from '../dto/UserDTO.js';

export const usersRepository = {
  findById: async (id) => UserDTO.toPublicResponse(await usersDao.findById(id)),
  findByEmail: async (email) => UserDTO.toPublicResponse(await usersDao.findOne({ email })),
  findCredentialsByEmail: async (email) => {
    const user = await usersDao.findOne({ email });
    if (!user) return null;

    // The hash stays internal to credential verification, never in the user DTO.
    return { user: UserDTO.toAuthenticatedResponse(user), passwordHash: user.password };
  },
  create: async (userData) => UserDTO.toPublicResponse(await usersDao.create(userData)),
  getAll: async () => (await usersDao.findAll()).map(UserDTO.toPublicResponse)
};
