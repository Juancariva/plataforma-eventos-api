import { ticketsDao } from '../dao/tickets.dao.js';
import TicketDTO from '../dto/TicketDTO.js';

const ACTIVE_STATUSES = ['confirmed', 'pending'];

export const ticketsRepository = {
  create: async (ticketData, session) => (
    TicketDTO.toPublicResponse(await ticketsDao.create(ticketData, session))
  ),
  findById: async (id, session) => ticketsDao.findById(id, session),
  findActive: async (userId, eventId, session) => ticketsDao.findOne({
    user: userId,
    event: eventId,
    status: { $in: ACTIVE_STATUSES }
  }, session),
  getReservedQuantity: async (eventId, session) => (
    ticketsDao.sumQuantityByEvent(eventId, ACTIVE_STATUSES, session)
  ),
  getByUser: async (userId) => {
    const tickets = await ticketsDao.findAll({ user: userId }, {
      populate: 'event',
      sort: { createdAt: -1 }
    });
    return tickets.map(TicketDTO.toPublicResponse);
  },
  getByEvent: async (eventId) => {
    const tickets = await ticketsDao.findAll({ event: eventId }, { sort: { createdAt: -1 } });
    return tickets.map(TicketDTO.toPublicResponse);
  },
  cancel: async (id, cancelledAt, session) => TicketDTO.toPublicResponse(await ticketsDao.update(
    { _id: id, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'cancelled', cancelledAt } },
    session
  ))
};
