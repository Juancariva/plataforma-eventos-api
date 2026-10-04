import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger
  },
  reservationCode: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date,
    default: null
  }
});

ticketSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } }
  }
);

ticketSchema.index({ event: 1, status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
