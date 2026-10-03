import { usersRepository } from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isEmptyString = (value) => (
  typeof value !== 'string' || value.trim().length === 0
);

const userResponse = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role
});

export const registerUser = async (userData = {}) => {
  const { first_name, last_name, email, password } = userData;

  if (
    isEmptyString(first_name)
    || isEmptyString(last_name)
    || isEmptyString(email)
    || isEmptyString(password)
  ) {
    throw createError('Faltan campos obligatorios', 400);
  }

  const normalizedFirstName = first_name.trim();
  const normalizedLastName = last_name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    throw createError('Formato de email invalido', 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError('La contrasena debe tener al menos 8 caracteres', 400);
  }

  const existingUser = await usersRepository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw createError('El email ya está registrado', 409);
  }

  const hashedPassword = await createHash(password);

  let user;

  try {
    user = await usersRepository.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      password: hashedPassword
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError('El email ya está registrado', 409);
    }

    throw error;
  }

  return userResponse(user);
};

export const loginUser = async (credentials = {}) => {
  const { email, password } = credentials;

  if (isEmptyString(email) || isEmptyString(password)) {
    throw createError('Credenciales inválidas', 401);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await usersRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw createError('Credenciales inválidas', 401);
  }

  const validPassword = await isValidPassword(password, user.password);

  if (!validPassword) {
    throw createError('Credenciales inválidas', 401);
  }

  return generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role
  });
};
