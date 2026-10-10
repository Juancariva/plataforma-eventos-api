import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

const ACTIVE_STATUSES = ['confirmed', 'pending'];

export const ticketsDao = {
  create: async (ticketData, session) => {
    const [ticket] = await Ticket.create([ticketData], { session });
    return ticket;
  },
  findById: async (id, session) => Ticket.findById(id).session(session || null).lean(),
  findActive: async (userId, eventId, session) => Ticket.findOne({
    user: userId,
    event: eventId,
    status: { $in: ACTIVE_STATUSES }
  }).session(session || null).lean(),
  getReservedQuantity: async (eventId, session) => {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: ACTIVE_STATUSES }
        }
      },
      { $group: { _id: '$event', total: { $sum: '$quantity' } } }
    ]).session(session || null);

    return result[0]?.total || 0;
  },
  getByUser: async (userId) => Ticket.find({ user: userId })
    .populate('event', 'title date location')
    .sort({ createdAt: -1 })
    .lean(),
  getByEvent: async (eventId) => Ticket.find({ event: eventId })
    .sort({ createdAt: -1 })
    .lean(),
  cancel: async (id, cancelledAt, session) => Ticket.findOneAndUpdate(
    { _id: id, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'cancelled', cancelledAt } },
    { new: true, runValidators: true, session }
  ).lean()
};
