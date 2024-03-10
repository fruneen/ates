import { transactionService } from 'resources/transaction';
import { taskService } from 'resources/task';

import { Event, EventName, TopicName, TransactionType } from 'types';
import { transactionSchema } from 'schemas';

import logger from 'logger';

import kafka from 'kafka';

const consumer = kafka.consumer({ groupId: 'analytics-service-group', maxWaitTimeInMs: 100 });

const run = async () => {
  await consumer.connect();

  await consumer.subscribe( {
    topics: [TopicName.TransactionsLifecycle],
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

          const userData = event.data;

          switch (event.name) {
            case EventName.TransactionApplied: {
              const parsedTransaction = await transactionSchema.strip().safeParseAsync(userData);

              if (parsedTransaction.success) {
                const transaction = await transactionService.insertOne(parsedTransaction.data);

                if (transaction.type === TransactionType.WITHDRAWAL) {
                  const { task } = transaction;

                  const relatedTask = await taskService.findOne({ publicId: task.publicId });

                  if (!relatedTask) {
                    await taskService.insertOne({
                      publicId: task.publicId,
                      costs: task.costs,
                    });
                  }
                }
              } else {
                logger.error(`[${event.name}]: An error occurred when parsing schema: ${parsedTransaction.error.message}`);
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