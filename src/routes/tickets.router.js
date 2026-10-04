import { Router } from 'express';
import { cancelTicket, getMyTickets } from '../controllers/tickets.controller.js';
import { authenticateStrategy } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateStrategy('current'));
router.get('/my-tickets', getMyTickets);
router.patch('/:tid/cancel', cancelTicket);

export default router;
