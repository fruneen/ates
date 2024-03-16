import _ from 'lodash';

import { taskService } from 'resources/task';

import { Event, EventName, TaskStatus, TopicName } from 'types';
import { analyticsTaskSchema } from 'schemas';

import logger from 'logger';
import kafka from 'kafka';

const consumer = kafka.consumer({ groupId: 'analytics-service-group', maxWaitTimeInMs: 100 });

const run = async () => {
  await consumer.connect();

  await consumer.subscribe( {
    topics: [TopicName.TasksStream],
    fromBeginning: false,
  });

  await consumer.run({
    autoCommit: true,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
    }) => {
      for (const message of batch.messages) {
        const prefix = `${batch.topic}[${batch.partition} | ${message.offset}] / ${message.timestamp}`;
        logger.debug(`- ${prefix} ${message.key}#${message.value}`);

        if (message.value) {
          const event: Event = JSON.parse(message.value as unknown as string) as Event;

          const taskData = event.data;

          switch (event.name) {
            case EventName.TaskCreated:
            case EventName.TaskUpdated: {
              const parsedTask = await analyticsTaskSchema.strip().safeParseAsync(taskData);

              if (parsedTask.success) {
                const isTaskAlreadyExists = await taskService.exists({ publicId: parsedTask.data.publicId });

                const analyticsTaskData = _.pick(parsedTask.data, ['publicId', 'description', 'assignee', 'costs']);

                if (!isTaskAlreadyExists) {
                  await taskService.insertOne(analyticsTaskData);
                } else {
                  await taskService.updateOne({ publicId: analyticsTaskData.publicId }, () => analyticsTaskData);
                }
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedTask.error.message}`);
              }

              break;
            }

            case EventName.TaskCompleted: {
              const parsedTask = await analyticsTaskSchema.strip().safeParseAsync(taskData);

              if (parsedTask.success) {
                await taskService.updateOne(
                  { publicId: parsedTask.data.publicId },
                  () => ({ status: TaskStatus.COMPLETED }),
                );
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedTask.error.message}`);
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

run().catch(e => logger.error(`[analytics-service/consumer] ${e.message}`, e));

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