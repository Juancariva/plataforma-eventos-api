import { eventsDao } from '../dao/events.dao.js';

export const eventsRepository = {
  getAll: async () => eventsDao.getAll()
};
