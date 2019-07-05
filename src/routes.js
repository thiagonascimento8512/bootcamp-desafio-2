import { Router } from 'express';
import multer from 'multer';

import authMiddleware from './app/middlewares/auth';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';

const upload = multer(multerConfig);

const routes = new Router();

routes.get('/', (req, res) => {
  res.json({ msg: 'Hello World' });
});

// Rotas sem Autenticação
routes.post('/users', UserController.store);
routes.post('/session', SessionController.store);

// Rotas que necessitam de autenticação
routes.use(authMiddleware);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.post('/meetup', MeetupController.store);
routes.put('/meetup', MeetupController.update);
routes.get('/mymeetups', MeetupController.myMeetups);
routes.get('/meetups', MeetupController.index);
routes.delete('/meetup/:id', MeetupController.delete);

routes.post('/subscription/:meetup_id', SubscriptionController.store);
routes.get('/subscription', SubscriptionController.index);

export default routes;
