import { EventName } from 'enums';

export type Event = {
  name: EventName,
  data: Record<string, unknown>,
};