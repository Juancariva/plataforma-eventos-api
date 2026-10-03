import { Router } from 'express';
import { getUsers } from '../controllers/users.controller.js';
import { authenticateStrategy } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get(
  '/',
  authenticateStrategy('current'),
  authorizeRoles('admin'),
  getUsers
);

export default router;
