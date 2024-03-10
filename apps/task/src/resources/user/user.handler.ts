import _ from 'lodash';

import { userService } from 'resources/user';

import { Event, EventName, TopicName } from 'types';
import { taskUserSchema } from 'schemas';

import logger from 'logger';

import kafka from 'kafka';

const consumer = kafka.consumer({ groupId: 'task-service-group', maxWaitTimeInMs: 100 });

const run = async () => {
  await consumer.connect();

  await consumer.subscribe( {
    topics: [TopicName.AccountsStream],
    fromBeginning: false,
  });

  await consumer.run({
    autoCommit: true,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
    }) => {
      logger.info(`Count of messages: ${batch.messages.length}`);
      for (const message of batch.messages) {
        const prefix = `${batch.topic}[${batch.partition} | ${message.offset}] / ${message.timestamp}`;
        logger.debug(`- ${prefix} ${message.key}#${message.value}`);

        if (message.value) {
          const event: Event = JSON.parse(message.value as unknown as string) as Event;

          const userData = event.data;

          switch (event.name) {
            case EventName.AccountCreated: {
              const parsedUserData = await taskUserSchema.omit({ _id: true }).strip().safeParseAsync(userData);

              if (parsedUserData.success) {
                await userService.insertOne(_.pick(parsedUserData.data, ['publicId', 'role']));
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedUserData.error.message}`);
              }

              break;
            }

            default: break;
          }
        }

        resolveOffset(message.offset);
        await heartbeat();
      }
    },
  });
};

run().catch(e => logger.error(`[task-service/consumer] ${e.message}`, e));

const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
  process.on(type, async e => {
    try {
      await consumer.disconnect();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });
});

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});