import Event from '../models/Event.js';

export const eventsDao = {
  getAll: async () => Event.find().lean()
};
