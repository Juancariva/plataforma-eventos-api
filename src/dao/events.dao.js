import Event from '../models/Event.js';

export const eventsDao = {
  getPaginated: async ({ filter, sort, skip, limit }) => {
    const [events, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Event.countDocuments(filter)
    ]);

    return { events, total };
  },
  create: async (eventData) => Event.create(eventData),
  findById: async (id) => Event.findById(id).lean(),
  updateById: async (id, eventData) => (
    Event.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true
    }).lean()
  )
};
