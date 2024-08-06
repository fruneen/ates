import { eventBus, InMemoryEvent } from '@paralect/node-mongo';

import { userService } from 'resources/user';

import { Event, EventName, TopicName, User } from 'types';
import { DATABASE_DOCUMENTS } from 'app-constants';
import { schemaRegistry } from 'schemas';

import logger from 'logger';
import kafka from 'kafka';

const { USERS } = DATABASE_DOCUMENTS;

eventBus.on(`${USERS}.created`, async ({ doc: user }: InMemoryEvent<User>) => {
  try {
    const event: Event = {
      name: EventName.AccountCreated,
      version: 1,
      data: userService.getPublic(user),
    };

    const { valid, errors } = await schemaRegistry.validateEvent(event.data, event.name, event.version);

    if (!valid) {
      logger.error(`[Schema Registry] Schema is invalid for event ${event.name}: ${JSON.stringify(errors)}`);
      return;
    }

    const producer = kafka.producer();

    await producer.connect();
    await producer.send({
      topic: TopicName.AccountsStream,
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (err) {
    logger.error(`${USERS}.created handler error: ${err}`);
  }
});
