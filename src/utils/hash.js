import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const createHash = async (password) => bcrypt.hash(password, SALT_ROUNDS);

export const isValidPassword = async (password, hashedPassword) => (
  bcrypt.compare(password, hashedPassword)
);
