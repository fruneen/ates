import { eventBus, InMemoryEvent } from '@paralect/node-mongo';

import { taskService } from 'resources/task';

import { Event, EventName, Task, TopicName } from 'types';
import { DATABASE_DOCUMENTS } from 'app-constants';
import { schemaRegistry } from 'schemas';

import logger from 'logger';
import kafka from 'kafka';

const { TASKS } = DATABASE_DOCUMENTS;

eventBus.on(`${TASKS}.created`, async ({ doc: task }: InMemoryEvent<Task>) => {
  try {
    const event: Event = {
      name: EventName.TaskCreated,
      version: 2,
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

eventBus.onUpdated(TASKS, ['assignee'], async ({ doc: task }: InMemoryEvent<Task>) => {
  try {
    const event: Event = {
      name: EventName.TaskAssigned,
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
      topic: TopicName.TasksLifecycle,
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (err) {
    logger.error(`${TASKS} onUpdated ['assignee'] handler error: ${err}`);
  }
});
