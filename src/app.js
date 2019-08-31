import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import multer from 'multer';

import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
    this.notFound();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    this.server.use(routes);
  }

  notFound() {
    this.server.use((req, res, next) => {
      return res.status(404).json({ error: 'Not Found' });
    });
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
