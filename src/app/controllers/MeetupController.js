import * as Yup from 'yup';
import { isBefore, parse } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';

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
}

export default new MeetupController();
