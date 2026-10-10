import { eventsDao } from '../dao/events.dao.js';

export const eventsRepository = {
  getPaginated: async (params) => eventsDao.getPaginated(params),
  create: async (eventData) => eventsDao.create(eventData),
  findById: async (id, session) => eventsDao.findById(id, session),
  initializeReservedSeats: async (id, quantity, session) => eventsDao.initializeReservedSeats(id, quantity, session),
  reserveSeats: async (id, quantity, session) => eventsDao.reserveSeats(id, quantity, session),
  releaseSeats: async (id, quantity, session) => eventsDao.releaseSeats(id, quantity, session),
  updateById: async (id, eventData, session) => eventsDao.updateById(id, eventData, session)
};
