import _ from 'lodash';

import { taskService } from 'resources/task';

import { Event, EventName, TopicName, TransactionOperation, TransactionType } from 'types';
import { taskSchema } from 'schemas';

import logger from 'logger';
import kafka from 'kafka';
import { applyTransaction } from '../transaction';

const consumer = kafka.consumer({ groupId: 'accounting-service-group', maxWaitTimeInMs: 100 });

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
            case EventName.TaskCreated: {
              const parsedTask = await taskSchema.strip().safeParseAsync(taskData);

              if (parsedTask.success) {
                const isTaskAlreadyExists = await taskService.exists({ publicId: parsedTask.data.publicId });

                if (!isTaskAlreadyExists) {
                  await taskService.insertOne(_.pick(parsedTask.data, ['publicId', 'description', 'assignee']));
                }
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedTask.error.message}`);
              }

              break;
            }

            case EventName.TaskAssigned: {
              const parsedTask = await taskSchema.strip().safeParseAsync(taskData);

              if (parsedTask.success) {
                const { publicId, assignee } = parsedTask.data;

                let task = await taskService.findOne({ publicId });

                if (!task) {
                  task = await taskService.insertOne(_.pick(parsedTask.data, ['publicId', 'description', 'assignee']));
                }

                await applyTransaction({
                  amount: Math.floor(Math.random() * (20 - 10 + 1) + 10),
                  type: TransactionType.ENROLLMENT,
                  operation: TransactionOperation.DEBIT,
                  metadata: {
                    task: task,
                    user: assignee,
                  },
                });
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedTask.error.message}`);
              }

              break;
            }

            case EventName.TaskCompleted: {
              const parsedTask = await taskSchema.strip().safeParseAsync(taskData);

              if (parsedTask.success) {
                const { publicId, assignee } = parsedTask.data;

                const task = await taskService.findOne({ publicId });

                if (task) {
                  await applyTransaction({
                    amount: task.costs,
                    type: TransactionType.WITHDRAWAL,
                    operation: TransactionOperation.CREDIT,
                    metadata: {
                      task: task,
                      user: assignee,
                    },
                  });
                }
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

run().catch(e => logger.error(`[accounting-service/consumer] ${e.message}`, e));

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