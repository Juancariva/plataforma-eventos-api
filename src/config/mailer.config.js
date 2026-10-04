import nodemailer from 'nodemailer';
import { env } from './env.config.js';

export const transporter = nodemailer.createTransport({
  host: env.mailHost,
  port: env.mailPort,
  secure: env.mailPort === 465,
  auth: {
    user: env.mailUser,
    pass: env.mailPass
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});
