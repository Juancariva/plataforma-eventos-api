import { eventsDao } from '../dao/events.dao.js';
import EventDTO from '../dto/EventDTO.js';

export const eventsRepository = {
  getPaginated: async (params) => {
    const [events, total] = await Promise.all([
      eventsDao.findAll(params),
      eventsDao.count(params.filter)
    ]);

    return { events: events.map(EventDTO.toPublicResponse), total };
  },
  create: async (eventData) => EventDTO.toPublicResponse(await eventsDao.create(eventData)),
  getById: async (id) => EventDTO.toPublicResponse(await eventsDao.findById(id)),
  // Business rules need the internal counter; public reads use getById and the DTO.
  findById: async (id, session) => eventsDao.findById(id, session),
  initializeReservedSeats: async (id, quantity, session) => eventsDao.initializeReservedSeats(id, quantity, session),
  reserveSeats: async (id, quantity, session) => eventsDao.reserveSeats(id, quantity, session),
  releaseSeats: async (id, quantity, session) => eventsDao.releaseSeats(id, quantity, session),
  updateById: async (id, eventData, session) => (
    EventDTO.toPublicResponse(await eventsDao.updateById(id, eventData, session))
  )
};
