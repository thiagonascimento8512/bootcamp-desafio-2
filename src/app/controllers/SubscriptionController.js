import * as Yup from 'yup';
import { isBefore, parse, isSameHour } from 'date-fns';

import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';

import SubscriptionMail from '../jobs/SubscriptionMail';
import Queue from '../../lib/queue';

class SubscriptionController {
  async store(req, res) {
    const { meetup_id } = req.params;

    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.params))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Verifica se o meetup existe
    const meetupExists = await Meetup.findByPk(meetup_id);
    if (!meetupExists) {
      return res.status(400).json({ error: 'Meetup does not exists' });
    }

    // Verifica se o usuário existe
    const userExists = await User.findByPk(req.userId);
    if (!userExists) {
      return res.status(400).json({ error: 'Invalid User' });
    }

    // Verifica se o meetup não pertence ao próprio usuário
    if (meetupExists.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: 'You can not subscribe for your own meetup' });
    }

    // Verifica se o meetup já aconteceu
    if (isBefore(parse(meetupExists.date), new Date())) {
      return res
        .status(401)
        .json({ error: 'You can not subscribe for past meetup' });
    }

    // Verifica se o usuáio já está inscrito no meetup
    const userMeetup = await Subscription.findOne({
      where: {
        meetup_id,
        user_id: req.userId,
      },
    });

    if (userMeetup) {
      return res
        .status(401)
        .json({ error: 'You have already subscribe for this meetup' });
    }

    /* Verifica se o horário solicitado é compatível
    com outros meetups em que o usuário já está inscrito
    */
    const dateMeetups = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          attributes: ['id', 'title', 'date'],
        },
      ],
      attributes: ['id'],
    });

    let hourConflits;

    dateMeetups.forEach(meetup => {
      const dateTime = meetup.Meetup.date;
      if (isSameHour(dateTime, meetupExists.date)) {
        hourConflits = `Meetups in same hour that ${meetup.Meetup.title} (id: ${meetup.Meetup.id})`;
      }
    });

    if (hourConflits) {
      return res.status(401).json({
        error: hourConflits,
      });
    }

    const subscription = await Subscription.create({
      meetup_id,
      user_id: req.userId,
    });

    await Queue.add(SubscriptionMail.key, {
      organizer: meetupExists.user_id,
      meetup: meetupExists.title,
      description: meetupExists.description,
      user: userExists.name,
      email: userExists.email,
    });

    return res.json({ subscription });
  }
}

export default new SubscriptionController();
