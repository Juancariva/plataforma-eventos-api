import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

export const ticketsDao = {
  create: async (ticketData, session) => {
    const [ticket] = await Ticket.create([ticketData], { session });
    return ticket;
  },
  findById: async (id, session) => Ticket.findById(id).session(session || null).lean(),
  findOne: async (filter, session) => Ticket.findOne(filter).session(session || null).lean(),
  sumQuantityByEvent: async (eventId, statuses, session) => {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: statuses }
        }
      },
      { $group: { _id: '$event', total: { $sum: '$quantity' } } }
    ]).session(session || null);

    return result[0]?.total || 0;
  },
  findAll: async (filter, { populate, sort } = {}) => (
    Ticket.find(filter).populate(populate).sort(sort).lean()
  ),
  update: async (filter, ticketData, session) => Ticket.findOneAndUpdate(
    filter,
    ticketData,
    { new: true, runValidators: true, session }
  ).lean()
};
