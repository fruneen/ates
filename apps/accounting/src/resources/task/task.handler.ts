import { eventBus, InMemoryEvent } from '@paralect/node-mongo';
import _ from 'lodash';

import { taskService } from 'resources/task';
import { applyTransaction } from 'resources/transaction';

import { AccountingTask, Event, EventName, TopicName, TransactionOperation, TransactionType } from 'types';
import { DATABASE_DOCUMENTS } from 'app-constants';
import { taskSchema, schemaRegistry, taskSchemaV1 } from 'schemas';

import logger from 'logger';
import kafka from 'kafka';

const { TASKS } = DATABASE_DOCUMENTS;

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
              switch (event.version) {
                case 1: {
                  const parsedTask = await taskSchemaV1.strip().safeParseAsync(taskData);

                  if (parsedTask.success) {
                    const isTaskAlreadyExists = await taskService.exists({ publicId: parsedTask.data.publicId });

                    if (!isTaskAlreadyExists) {
                      const task = await taskService.insertOne(_.pick(parsedTask.data, ['publicId', 'description', 'assignee']));

                      await applyTransaction({
                        amount: Math.floor(Math.random() * (20 - 10 + 1) + 10),
                        type: TransactionType.ENROLLMENT,
                        operation: TransactionOperation.DEBIT,
                        metadata: {
                          task: task,
                          user: parsedTask.data.assignee,
                        },
                      });
                    }
                  } else {
                    logger.error(`[${event.name} v1]: An error occurred when parsing schema: ${parsedTask.error.message}`);
                  }

                  break;
                }
                case 2: {
                  const parsedTask = await taskSchema.strip().safeParseAsync(taskData);

                  if (parsedTask.success) {
                    const isTaskAlreadyExists = await taskService.exists({ publicId: parsedTask.data.publicId });

                    if (!isTaskAlreadyExists) {
                      const task = await taskService.insertOne(_.pick(parsedTask.data, ['publicId', 'description', 'assignee']));

                      await applyTransaction({
                        amount: Math.floor(Math.random() * (20 - 10 + 1) + 10),
                        type: TransactionType.ENROLLMENT,
                        operation: TransactionOperation.DEBIT,
                        metadata: {
                          task: task,
                          user: parsedTask.data.assignee,
                        },
                      });
                    }
                  } else {
                    logger.error(`[${event.name} v2]: An error occurred when parsing schema: ${parsedTask.error.message}`);
                  }

                  break;
                }
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

// when we create a task in accounting service, we add price for a task, which can be needed in another service
eventBus.on(`${TASKS}.created`, async ({ doc: task }: InMemoryEvent<AccountingTask>) => {
  try {
    const event: Event = {
      name: EventName.TaskUpdated,
      version: 1,
      data: taskService.getPublic(task),
    };

    const { valid, errors } = await schemaRegistry.validateEvent(event.data, event.name, event.version);

    if (!valid) {
      logger.error(`[Schema Registry] Schema is invalid for event ${event.name}: ${JSON.stringify(errors)}`);
      return;
    }

    const producer = kafka.producer();

    await producer.connect();
    await producer.send({
      topic: TopicName.TasksStream,
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (err) {
    logger.error(`${TASKS}.created handler error: ${err}`);
  }
});

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