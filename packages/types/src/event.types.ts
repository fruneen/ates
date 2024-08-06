import { EventName } from 'enums';

export type Event = {
  name: EventName,
  version: number,
  data: Record<string, unknown>,
};