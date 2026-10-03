import Event from '../models/Event.js';

export const eventsDao = {
  getAll: async () => Event.find().lean(),
  create: async (eventData) => Event.create(eventData),
  findById: async (id) => Event.findById(id).lean(),
  updateById: async (id, eventData) => (
    Event.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true
    }).lean()
  )
};
