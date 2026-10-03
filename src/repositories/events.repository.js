import { eventsDao } from '../dao/events.dao.js';

export const eventsRepository = {
  getPaginated: async (params) => eventsDao.getPaginated(params),
  create: async (eventData) => eventsDao.create(eventData),
  findById: async (id) => eventsDao.findById(id),
  updateById: async (id, eventData) => eventsDao.updateById(id, eventData)
};
