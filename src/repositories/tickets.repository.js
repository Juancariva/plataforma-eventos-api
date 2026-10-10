import { ticketsDao } from '../dao/tickets.dao.js';

export const ticketsRepository = {
  create: async (ticketData, session) => ticketsDao.create(ticketData, session),
  findById: async (id, session) => ticketsDao.findById(id, session),
  findActive: async (userId, eventId, session) => ticketsDao.findActive(userId, eventId, session),
  getReservedQuantity: async (eventId, session) => ticketsDao.getReservedQuantity(eventId, session),
  getByUser: async (userId) => ticketsDao.getByUser(userId),
  getByEvent: async (eventId) => ticketsDao.getByEvent(eventId),
  cancel: async (id, cancelledAt, session) => ticketsDao.cancel(id, cancelledAt, session)
};
