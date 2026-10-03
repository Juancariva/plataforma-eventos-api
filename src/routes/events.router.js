import { Router } from 'express';
import { createEvent, getEvents, updateEvent } from '../controllers/events.controller.js';
import { authenticateStrategy } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/', getEvents);
router.post(
  '/',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  createEvent
);
router.put(
  '/:eid',
  authenticateStrategy('current'),
  authorizeRoles('organizer', 'admin'),
  updateEvent
);

export default router;
