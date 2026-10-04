import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

const ACTIVE_STATUSES = ['confirmed', 'pending'];

export const ticketsDao = {
  create: async (ticketData) => Ticket.create(ticketData),
  findById: async (id) => Ticket.findById(id).lean(),
  findActive: async (userId, eventId) => Ticket.findOne({
    user: userId,
    event: eventId,
    status: { $in: ACTIVE_STATUSES }
  }).lean(),
  getReservedQuantity: async (eventId) => {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: ACTIVE_STATUSES }
        }
      },
      { $group: { _id: '$event', total: { $sum: '$quantity' } } }
    ]);

    return result[0]?.total || 0;
  },
  getByUser: async (userId) => Ticket.find({ user: userId })
    .populate('event', 'title date location')
    .sort({ createdAt: -1 })
    .lean(),
  getByEvent: async (eventId) => Ticket.find({ event: eventId })
    .sort({ createdAt: -1 })
    .lean(),
  cancel: async (id, cancelledAt) => Ticket.findOneAndUpdate(
    { _id: id, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'cancelled', cancelledAt } },
    { new: true, runValidators: true }
  ).lean()
};
