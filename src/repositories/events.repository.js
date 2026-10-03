import { eventsDao } from '../dao/events.dao.js';

export const eventsRepository = {
  getAll: async () => eventsDao.getAll(),
  create: async (eventData) => eventsDao.create(eventData),
  findById: async (id) => eventsDao.findById(id),
  updateById: async (id, eventData) => eventsDao.updateById(id, eventData)
};
