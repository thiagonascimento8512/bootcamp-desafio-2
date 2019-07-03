import express from 'express';
import { resolve } from 'path';
import multer from 'multer';

import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
  }

  exceptionHandler() {
    this.server.use((error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({ error });
    });
  }
}

export default new App().server;
