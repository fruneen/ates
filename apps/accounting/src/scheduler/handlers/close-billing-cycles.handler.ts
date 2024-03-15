import { userService } from 'resources/user';

import cron from 'scheduler/cron';
import logger from 'logger';

import { Event, EventName, TopicName } from 'types';

import kafka from 'kafka';

const schedule = {
  development: 'cron:every-minute',
  staging: 'cron:every-day',
  production: 'cron:every-day',
};

cron.on(schedule[process.env.APP_ENV], async () => {
  try {
    const { results: users } = await userService.find({ balance: { $gt: 0 } });

    // make payment for each user via an external payment system ...

    await userService.updateMany(
      {
        _id: {
          $in: users.map(({ _id }) => _id),
        },
      },
      () => ({ balance: 0 }),
    );

    const events: Event[] = users.map((u) => ({
      name: EventName.PaymentCompleted,
      data: { userPublicId: u.publicId },
    }));

    const producer = kafka.producer();

    await producer.connect();
    await producer.send({
      topic: TopicName.PaymentLifecycle,
      messages: events.map((e) => ({ value: JSON.stringify(e) })),
    });
  } catch (error) {
    logger.error(error);
  }
});
