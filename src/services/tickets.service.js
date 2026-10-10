import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { eventsRepository } from '../repositories/events.repository.js';
import { ticketsRepository } from '../repositories/tickets.repository.js';
import { sendTicketConfirmationEmail } from './mail.service.js';
import { ensureReservedSeats } from './events.service.js';
import { withDatabaseTransaction } from '../utils/transaction.js';

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeId = (id, message) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(message, 404);
  }

  return new mongoose.Types.ObjectId(id).toString();
};

const ticketResponse = (ticket) => ({
  id: ticket._id.toString(),
  user: ticket.user.toString(),
  event: ticket.event && 'title' in ticket.event
    ? {
      id: ticket.event._id.toString(),
      title: ticket.event.title,
      date: ticket.event.date,
      location: ticket.event.location
    }
    : ticket.event?.toString() || null,
  status: ticket.status,
  quantity: ticket.quantity,
  reservationCode: ticket.reservationCode,
  createdAt: ticket.createdAt,
  cancelledAt: ticket.cancelledAt
});

const getEvent = async (eventId, session) => {
  const event = await eventsRepository.findById(eventId, session);

  if (!event) {
    throw createError('Evento no encontrado', 404);
  }

  return event;
};

const validateEnrollmentEvent = (event) => {
  if (event.status !== 'published') {
    throw createError('El evento no esta disponible para inscripciones', 400);
  }

  if (new Date(event.date).getTime() <= Date.now()) {
    throw createError('No es posible inscribirse a un evento finalizado', 400);
  }
};

export const ticketsService = {
  create: async (id, ticketData, user) => {
    const eventId = normalizeId(id, 'Evento no encontrado');
    const quantity = ticketData?.quantity;

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw createError('quantity debe ser un numero entero mayor a 0', 400);
    }

    const { ticket, event } = await withDatabaseTransaction(async (session) => {
      const foundEvent = await getEvent(eventId, session);
      validateEnrollmentEvent(foundEvent);

      const existingTicket = await ticketsRepository.findActive(user.id, eventId, session);

      if (existingTicket) {
        throw createError('Ya tenes una inscripcion activa para este evento', 409);
      }

      await ensureReservedSeats(foundEvent, session);
      const reservedEvent = await eventsRepository.reserveSeats(eventId, quantity, session);

      if (!reservedEvent) {
        validateEnrollmentEvent(await getEvent(eventId, session));
        throw createError('No hay cupos suficientes disponibles', 400);
      }

      try {
        const createdTicket = await ticketsRepository.create({
          user: user.id,
          event: eventId,
          quantity,
          reservationCode: randomUUID(),
          status: 'confirmed'
        }, session);

        return { ticket: createdTicket, event: reservedEvent };
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.user && error.keyPattern?.event) {
          throw createError('Ya tenes una inscripcion activa para este evento', 409);
        }

        throw error;
      }
    });

    try {
      await sendTicketConfirmationEmail({ to: user.email, event, ticket });
    } catch (error) {
      console.error(`No se pudo enviar el email del ticket ${ticket._id}. Revisar MAIL_* y el servidor SMTP.`);
    }

    return ticketResponse(ticket);
  },
  getMyTickets: async (user) => {
    const tickets = await ticketsRepository.getByUser(user.id);
    return tickets.map(ticketResponse);
  },
  getEventTickets: async (id, user) => {
    const eventId = normalizeId(id, 'Evento no encontrado');
    const event = await getEvent(eventId);

    if (user.role !== 'admin' && event.organizer.toString() !== user.id) {
      throw createError('No tenes permisos para consultar los tickets de este evento', 403);
    }

    const tickets = await ticketsRepository.getByEvent(eventId);
    return tickets.map(ticketResponse);
  },
  cancel: async (id, user) => {
    const ticketId = normalizeId(id, 'Ticket no encontrado');

    return withDatabaseTransaction(async (session) => {
      const ticket = await ticketsRepository.findById(ticketId, session);

      if (!ticket) {
        throw createError('Ticket no encontrado', 404);
      }

      if (user.role !== 'admin' && ticket.user.toString() !== user.id) {
        throw createError('No tenes permisos para cancelar este ticket', 403);
      }

      if (ticket.status === 'cancelled') {
        throw createError('El ticket ya esta cancelado', 400);
      }

      const event = await getEvent(ticket.event, session);
      await ensureReservedSeats(event, session);
      const cancelledTicket = await ticketsRepository.cancel(ticketId, new Date(), session);

      if (!cancelledTicket) {
        throw createError('El ticket ya esta cancelado', 400);
      }

      const releasedEvent = await eventsRepository.releaseSeats(ticket.event, ticket.quantity, session);

      if (!releasedEvent) {
        throw createError('No se pudieron liberar los cupos del evento', 503);
      }

      return ticketResponse(cancelledTicket);
    });
  }
};
