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
  findById: async (id, session) => Event.findById(id).session(session || null).lean(),
  initializeReservedSeats: async (id, quantity, session) => Event.findOneAndUpdate(
    { _id: id, reservedSeats: { $exists: false } },
    { $set: { reservedSeats: quantity } },
    { new: true, runValidators: true, session }
  ).lean(),
  reserveSeats: async (id, quantity, session) => Event.findOneAndUpdate(
    {
      _id: id,
      status: 'published',
      date: { $gt: new Date() },
      $expr: { $lte: [{ $add: ['$reservedSeats', quantity] }, '$capacity'] }
    },
    { $inc: { reservedSeats: quantity } },
    { new: true, runValidators: true, session }
  ).lean(),
  releaseSeats: async (id, quantity, session) => Event.findOneAndUpdate(
    { _id: id, reservedSeats: { $gte: quantity } },
    { $inc: { reservedSeats: -quantity } },
    { new: true, runValidators: true, session }
  ).lean(),
  updateById: async (id, eventData, session) => {
    const filter = { _id: id };

    if (eventData.capacity !== undefined) {
      filter.reservedSeats = { $lte: eventData.capacity };
      filter.status = { $ne: 'cancelled' };
    }

    return Event.findOneAndUpdate(filter, eventData, {
      new: true,
      runValidators: true,
      session
    }).lean();
  }
};
