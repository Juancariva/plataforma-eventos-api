import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { initializePassport } from './config/passport.config.js';
import eventsRouter from './routes/events.router.js';
import healthRouter from './routes/health.router.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import sessionsRouter from './routes/sessions.router.js';
import usersRouter from './routes/users.router.js';

const app = express();

initializePassport();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/health', healthRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
