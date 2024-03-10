import { eventBus, InMemoryEvent } from '@paralect/node-mongo';

import { userService } from 'resources/user';

import { Event, EventName, TopicName, User } from 'types';
import { DATABASE_DOCUMENTS } from 'app-constants';

import logger from 'logger';
import kafka from 'kafka';

const { USERS } = DATABASE_DOCUMENTS;

eventBus.on(`${USERS}.created`, async ({ doc: user }: InMemoryEvent<User>) => {
  try {
    const event: Event = {
      name: EventName.AccountCreated,
      data: userService.getPublic(user),
    };

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
