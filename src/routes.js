import { Router } from 'express';
import multer from 'multer';

import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';

import authMiddleware from './app/middlewares/auth';

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
routes.get('/meetup', MeetupController.index);
routes.delete('/meetup/:id', MeetupController.delete);

export default routes;
