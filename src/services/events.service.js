import { eventsRepository } from '../repositories/events.repository.js';

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isEmptyString = (value) => (
  typeof value !== 'string' || value.trim().length === 0
);

const eventResponse = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  organizer: event.organizer.toString()
});

const validateRequiredEventFields = (eventData) => {
  const {
    title,
    description,
    date,
    location,
    capacity
  } = eventData;

  if (
    isEmptyString(title)
    || isEmptyString(description)
    || isEmptyString(date)
    || isEmptyString(location)
    || capacity === undefined
  ) {
    throw createError('Faltan campos obligatorios', 400);
  }
};

const allowedEventUpdateFields = (eventData) => {
  const allowedFields = ['title', 'description', 'date', 'location', 'capacity'];

  return allowedFields.reduce((updatedFields, field) => {
    if (eventData[field] !== undefined) {
      updatedFields[field] = typeof eventData[field] === 'string'
        ? eventData[field].trim()
        : eventData[field];
    }

    return updatedFields;
  }, {});
};

export const eventsService = {
  getAll: async () => eventsRepository.getAll(),

  create: async (eventData, user) => {
    validateRequiredEventFields(eventData);

    const event = await eventsRepository.create({
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      date: eventData.date,
      location: eventData.location.trim(),
      capacity: eventData.capacity,
      organizer: user.id
    });

    return eventResponse(event);
  },

  update: async (id, eventData, user) => {
    const event = await eventsRepository.findById(id);

    if (!event) {
      throw createError('Evento no encontrado', 404);
    }

    const isOwner = event.organizer.toString() === user.id;

    if (user.role === 'organizer' && !isOwner) {
      throw createError('No tenés permisos para realizar esta acción', 403);
    }

    const updatedEvent = await eventsRepository.updateById(
      id,
      allowedEventUpdateFields(eventData)
    );

    return eventResponse(updatedEvent);
  }
};
