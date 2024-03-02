import { Kafka, logCreator, logLevel } from 'kafkajs';

import logger from 'logger';

const toWinstonLogLevel = (level: logLevel) => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return 'error';
    case logLevel.WARN:
      return 'warn';
    case logLevel.INFO:
      return 'info';
    case logLevel.DEBUG:
      return 'debug';
  }
};
const WinstonLogCreator: logCreator = () => {
  return ({ level, log }) => {
    const { message, ...extra } = log;

    logger.log({
      level: toWinstonLogLevel(level),
      message: `[Kafka] ${message}`,
      extra,
    });
  };
};

const kafka = new Kafka({
  clientId: 'task-service',
  brokers: ['localhost:9092'],
  logCreator: WinstonLogCreator,
});

export default kafka;