import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.get('/', (req, res) => {
  res.json({ msg: 'Hello World' });
});

routes.post('/users', UserController.store);
routes.put('/users', authMiddleware, UserController.update);
routes.post('/session', SessionController.store);

export default routes;
