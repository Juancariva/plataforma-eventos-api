import mongoose from 'mongoose';
import { eventsRepository } from '../repositories/events.repository.js';

const VALID_STATUSES = ['draft', 'published', 'cancelled', 'finished'];
const ALLOWED_SORT_FIELDS = ['date', 'price', 'capacity', 'title'];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isEmptyString = (value) => (
  typeof value !== 'string' || value.trim().length === 0
);

const toNumber = (value) => Number(value);

const isPastDate = (date) => new Date(date).getTime() < Date.now();

const eventResponse = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  price: event.price,
  status: event.status,
  organizer: event.organizer.toString()
});

const ensureValidObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError('Evento no encontrado', 404);
  }
};

const validateRequiredEventFields = (eventData) => {
  const {
    title,
    description,
    category,
    date,
    location,
    capacity,
    price
  } = eventData;

  if (
    isEmptyString(title)
    || isEmptyString(description)
    || isEmptyString(category)
    || isEmptyString(date)
    || isEmptyString(location)
    || capacity === undefined
    || price === undefined
  ) {
    throw createError('Faltan campos obligatorios', 400);
  }
};

const validateCapacityAndPrice = ({ capacity, price }) => {
  if (capacity !== undefined && toNumber(capacity) <= 0) {
    throw createError('La capacidad debe ser mayor a 0', 400);
  }

  if (price !== undefined && toNumber(price) < 0) {
    throw createError('El precio no puede ser negativo', 400);
  }
};

const ensureCanManageEvent = (event, user) => {
  const isOwner = event.organizer.toString() === user.id;

  if (user.role === 'organizer' && !isOwner) {
    throw createError('No tenés permisos para realizar esta acción', 403);
  }
};

const ensureEventCanBeModified = (event) => {
  if (event.status === 'cancelled') {
    throw createError('Los eventos cancelados no pueden modificarse', 400);
  }
};

const normalizeEventPayload = (eventData, includeStatus = false) => {
  const payload = {
    title: eventData.title.trim(),
    description: eventData.description.trim(),
    category: eventData.category.trim(),
    date: eventData.date,
    location: eventData.location.trim(),
    capacity: toNumber(eventData.capacity),
    price: toNumber(eventData.price)
  };

  if (includeStatus && eventData.status !== undefined) {
    payload.status = eventData.status;
  }

  return payload;
};

const allowedEventUpdateFields = (eventData) => {
  const allowedFields = [
    'title',
    'description',
    'category',
    'date',
    'location',
    'capacity',
    'price'
  ];

  return allowedFields.reduce((updatedFields, field) => {
    if (eventData[field] === undefined) {
      return updatedFields;
    }

    updatedFields[field] = typeof eventData[field] === 'string'
      ? eventData[field].trim()
      : eventData[field];

    if (field === 'capacity' || field === 'price') {
      updatedFields[field] = toNumber(eventData[field]);
    }

    return updatedFields;
  }, {});
};

const buildEventFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.location) {
    filter.location = query.location;
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};

    if (query.dateFrom) {
      filter.date.$gte = new Date(query.dateFrom);
    }

    if (query.dateTo) {
      filter.date.$lte = new Date(query.dateTo);
    }
  }

  return filter;
};

const buildSort = (sortValue = 'date') => {
  const direction = sortValue.startsWith('-') ? -1 : 1;
  const field = sortValue.replace('-', '');

  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    return { date: 1 };
  }

  return { [field]: direction };
};

export const eventsService = {
  getAll: async (query = {}) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const filter = buildEventFilter(query);
    const sort = buildSort(query.sort);

    const { events, total } = await eventsRepository.getPaginated({
      filter,
      sort,
      skip,
      limit
    });

    return {
      data: events.map(eventResponse),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  },

  getById: async (id) => {
    ensureValidObjectId(id);

    const event = await eventsRepository.findById(id);

    if (!event) {
      throw createError('Evento no encontrado', 404);
    }

    return eventResponse(event);
  },

  create: async (eventData, user) => {
    validateRequiredEventFields(eventData);
    validateCapacityAndPrice(eventData);

    if (isPastDate(eventData.date)) {
      throw createError('No se puede crear un evento con fecha pasada', 400);
    }

    if (eventData.status && !VALID_STATUSES.includes(eventData.status)) {
      throw createError('Estado de evento inválido', 400);
    }

    const payload = normalizeEventPayload(eventData, true);

    if (payload.status === 'cancelled' || payload.status === 'finished') {
      throw createError('No se puede crear un evento finalizado o cancelado', 400);
    }

    const event = await eventsRepository.create({
      ...payload,
      organizer: user.id
    });

    return eventResponse(event);
  },

  update: async (id, eventData, user) => {
    ensureValidObjectId(id);

    const event = await eventsRepository.findById(id);

    if (!event) {
      throw createError('Evento no encontrado', 404);
    }

    ensureCanManageEvent(event, user);
    ensureEventCanBeModified(event);
    validateCapacityAndPrice(eventData);

    if (eventData.date && isPastDate(eventData.date)) {
      throw createError('No se puede asignar una fecha pasada', 400);
    }

    const updatedEvent = await eventsRepository.updateById(
      id,
      allowedEventUpdateFields(eventData)
    );

    return eventResponse(updatedEvent);
  },

  updateStatus: async (id, status, user) => {
    ensureValidObjectId(id);

    if (!VALID_STATUSES.includes(status)) {
      throw createError('Estado de evento inválido', 400);
    }

    const event = await eventsRepository.findById(id);

    if (!event) {
      throw createError('Evento no encontrado', 404);
    }

    ensureCanManageEvent(event, user);

    if (event.status === 'cancelled') {
      throw createError('No se puede cambiar el estado de un evento cancelado', 400);
    }

    if (status === 'published' && event.status === 'finished') {
      throw createError('No se puede publicar un evento finalizado', 400);
    }

    const updatedEvent = await eventsRepository.updateById(id, { status });

    return eventResponse(updatedEvent);
  }
};
