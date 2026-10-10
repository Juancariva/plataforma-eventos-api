export default class EventDTO {
  static toPublicResponse(event) {
    if (!event) return null;

    return {
      id: (event._id ?? event.id).toString(),
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      price: event.price,
      status: event.status,
      organizer: (event.organizer._id ?? event.organizer).toString()
    };
  }

  static toTicketResponse(event) {
    if (!event) return null;

    return {
      id: (event._id ?? event.id).toString(),
      title: event.title,
      date: event.date,
      location: event.location
    };
  }
}
