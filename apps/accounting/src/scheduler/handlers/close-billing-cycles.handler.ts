import { userService } from 'resources/user';

import cron from 'scheduler/cron';
import logger from 'logger';

import { Event, EventName, TopicName } from 'types';
import { schemaRegistry } from 'schemas';

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
      version: 1,
      data: { userPublicId: u.publicId },
    }));

    const producer = kafka.producer();

    await producer.connect();

    for (const event of events) {
      const { valid, errors } = await schemaRegistry.validateEvent(event.data, event.name, event.version);

      if (!valid) {
        logger.error(`[Schema Registry] Schema is invalid for event ${event.name}: ${JSON.stringify(errors)}`);
        return;
      }

      await producer.send({
        topic: TopicName.PaymentLifecycle,
        messages: [{ value: JSON.stringify(event) }],
      });
    }
  } catch (error) {
    logger.error(error);
  }
});
