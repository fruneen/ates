import _ from 'lodash';

import { transactionService } from 'resources/transaction';
import { userService } from 'resources/user';

import {
  AccountingTask,
  AccountingUser,
  Event,
  EventName,
  TopicName,
  TransactionOperation,
  TransactionType,
} from 'types';
import { schemaRegistry } from 'schemas';

import kafka from 'kafka';
import db from 'db';

type ApplyTransactionMetadata = {
  user: Pick<AccountingUser, 'publicId'>
  task: Pick<AccountingTask, 'publicId' | 'costs'>
};

type ApplyTransactionProps = {
  amount: number
  type: TransactionType
  operation: TransactionOperation
  metadata: ApplyTransactionMetadata
};

export const applyTransaction = async ({ amount, type, operation, metadata }: ApplyTransactionProps) => {
  const { transaction } = await db.withTransaction(async (session) => {
    const [insertedTransaction] = await Promise.all([
      transactionService.insertOne(
        {
          amount,
          type,
          operation,
          userPublicId: metadata.user.publicId,
          task: _.pick(metadata.task, ['publicId', 'costs']),
        },
        {},
        { session },
      ),
      userService.updateOne(
        { publicId: metadata.user.publicId },
        (old) => ({
          ...old,
          balance: old.balance + operation === TransactionOperation.DEBIT ? -amount : amount,
        }),
        {},
        { session },
      ),
    ]);

    return { transaction: insertedTransaction };
  });


  const event: Event = {
    name: EventName.TransactionApplied,
    version: 1,
    data: transaction,
  };

  const { valid, errors } = await schemaRegistry.validateEvent(event.data, event.name, event.version);

  if (!valid) {
    logger.error(`[Schema Registry] Schema is invalid for event ${event.name}: ${JSON.stringify(errors)}`);
    return;
  }

  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: TopicName.TransactionsLifecycle,
    messages: [{ value: JSON.stringify(event) }],
  });
};