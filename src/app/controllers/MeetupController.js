import * as Yup from 'yup';
import { isBefore, parse } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      image: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { image, date } = req.body;

    const imageExists = await File.findByPk(image);

    // Verifica se a imagem existe
    if (!imageExists) {
      return res.status(400).json({ error: 'Invalid image' });
    }

    const dateParse = parse(date);
    // Verifica se a data já passou
    if (isBefore(dateParse, new Date())) {
      return res.status(401).json({ error: 'Past dates are not permited' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      id: Yup.number().required(),
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      image: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, date } = req.body;

    // Verifica se o evento pertence ao usuário
    const event = await Meetup.findOne({
      where: {
        id,
        user_id: req.userId,
      },
    });

    if (!event) {
      return res.status(401).json({ error: 'You can only edit your events' });
    }

    // Verifica se o evento já passou
    if (isBefore(parse(event.date), new Date())) {
      return res.status(401).json({ error: 'You can not edit passed events' });
    }

    // Verifica se a nova data já passou
    if (isBefore(parse(date), new Date())) {
      return res.status(401).json({ error: 'You can not set passed date' });
    }

    const meetup = await event.update(req.body);

    return res.json(meetup);
  }

  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'name'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    res.json(meetups);
  }
}

export default new MeetupController();
