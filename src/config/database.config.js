import mongoose from 'mongoose';
import { env } from './env.config.js';

export const connectDatabase = async () => {
  await mongoose.connect(env.mongoUrl);
  console.log('MongoDB conectado');
};
