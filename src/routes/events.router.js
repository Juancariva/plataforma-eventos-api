import { Router } from 'express';
import {
  createEvent,
  getEventById,
  getEvents,
  updateEvent,
  updateEventStatus
} from '../controllers/events.controller.js';
import { authenticateStrategy } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorize.middleware.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post(
  '/',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  createEvent
);
router.put(
  '/:id',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  updateEvent
);
router.patch(
  '/:id/status',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  updateEventStatus
);

router.post('/:eid/tickets', authenticateStrategy('current'), createTicket);
router.get(
  '/:eid/tickets',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  getEventTickets
);

export default router;
