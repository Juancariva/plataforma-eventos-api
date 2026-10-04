import { transporter } from '../config/mailer.config.js';
import { env } from '../config/env.config.js';

export const sendTicketConfirmationEmail = async ({ to, event, ticket }) => {
  if (!env.mailHost || !env.mailUser || !env.mailPass || !env.mailFrom
    || !Number.isInteger(env.mailPort) || env.mailPort <= 0 || env.mailPort > 65535) {
    throw new Error('Configuracion de email incompleta: revisar las variables MAIL_*');
  }

  return transporter.sendMail({
    from: env.mailFrom,
    to,
    subject: 'Confirmacion de inscripcion',
    text: [
      'Tu inscripcion fue confirmada.',
      `Evento: ${event.title}`,
      `Fecha: ${new Date(event.date).toISOString()}`,
      `Ubicacion: ${event.location}`,
      `Cantidad de lugares: ${ticket.quantity}`,
      `Codigo de reserva: ${ticket.reservationCode}`
    ].join('\n')
  });
};
