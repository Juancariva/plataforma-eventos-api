import { Router } from 'express';
import {
  current,
  getSessions,
  login,
  logout,
  register
} from '../controllers/sessions.controller.js';
import { authenticateStrategy } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getSessions);
router.post('/register', authenticateStrategy('register'), register);
router.post('/login', authenticateStrategy('login'), login);
router.get('/current', authenticateStrategy('current'), current);
router.post('/logout', logout);

export default router;
