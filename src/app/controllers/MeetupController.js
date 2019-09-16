import * as Yup from 'yup';
import { Op } from 'sequelize';
import { isBefore, parse, startOfDay, endOfDay } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';
import Subscription from '../models/Subscription';

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
      date: dateParse,
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

  async myMeetups(req, res) {
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

    return res.json(meetups);
  }

  async index(req, res) {
    const { date } = req.query;
    const formatedDate = parse(date);

    const schema = Yup.object().shape({
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const meetupSubscription = await Subscription.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'meetup_id'],
    });

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(formatedDate), endOfDay(formatedDate)],
        },
      },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'url', 'path'],
        },
      ],
    });

    // Cria uma nova propriedade para os meetups aos quais o
    // usuário encontra-se inscrito
    const newMeetups = meetups.map(m => {
      const sb = meetupSubscription.find(n => n.meetup_id === m.id);
      if (sb) return { ...m.dataValues, subscription: true };
      return m.dataValues;
    });

    return res.json(newMeetups);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
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

    if (!meetup) {
      return res.status(400).json({ error: 'This meetup does not exists' });
    }

    if (meetup.organizer.id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'You do not have permission to delete this meetup' });
    }

    if (isBefore(parse(meetup.date), new Date())) {
      return res
        .status(401)
        .json({ error: 'You can not delete a past meetup' });
    }

    try {
      meetup.destroy();
      return res.json({ success: 'The meetup was been delete' });
    } catch (err) {
      return res.status(500).json({ error: 'An error occurred' });
    }
  }
}

export default new MeetupController();
