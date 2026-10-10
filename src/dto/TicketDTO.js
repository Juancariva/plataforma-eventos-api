import EventDTO from './EventDTO.js';

export default class TicketDTO {
  static toPublicResponse(ticket) {
    if (!ticket) return null;

    const populatedEvent = ticket.event && typeof ticket.event === 'object'
      && 'title' in ticket.event;

    return {
      id: (ticket._id ?? ticket.id).toString(),
      user: (ticket.user._id ?? ticket.user).toString(),
      event: populatedEvent
        ? EventDTO.toTicketResponse(ticket.event)
        : ticket.event?.toString() || null,
      status: ticket.status,
      quantity: ticket.quantity,
      reservationCode: ticket.reservationCode,
      createdAt: ticket.createdAt,
      cancelledAt: ticket.cancelledAt
    };
  }
}
