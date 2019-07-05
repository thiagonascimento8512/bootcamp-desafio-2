import Mail from '../../lib/mail';

class SubscriptionMail {
  async handle({ data }) {
    await Mail.sendMail({
      to: 'thiago_t_ht@hotmail.com',
      subject: `Nova Inscrição <${data.meetup}>`,
      template: 'subscription',
      context: {
        ...data,
      },
    });
  }
}

export default new SubscriptionMail();
