import { ticketsDao } from '../dao/tickets.dao.js';

export const ticketsRepository = {
  create: async (ticketData) => ticketsDao.create(ticketData),
  findById: async (id) => ticketsDao.findById(id),
  findActive: async (userId, eventId) => ticketsDao.findActive(userId, eventId),
  getReservedQuantity: async (eventId) => ticketsDao.getReservedQuantity(eventId),
  getByUser: async (userId) => ticketsDao.getByUser(userId),
  getByEvent: async (eventId) => ticketsDao.getByEvent(eventId),
  cancel: async (id, cancelledAt) => ticketsDao.cancel(id, cancelledAt)
};
