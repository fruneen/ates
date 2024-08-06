import { validate, ValidatorResult } from 'jsonschema';

import { EventName } from 'enums';
import fs from 'fs';
import path from 'path';

export const validateEvent = async (
  data: Record<string, unknown>,
  event: EventName,
  version: number,
): Promise<ValidatorResult> => {
  const jsonSchemaPath = eventToJsonSchema(event, version);

  const jsonSchema = await readJSON(jsonSchemaPath);

  return validate(JSON.parse(JSON.stringify(data)), jsonSchema);
};

const eventToJsonSchema = (event: EventName, version: number): string => {
  let filePath = '';

  switch (event) {
    case EventName.AccountCreated:
      filePath = `./events/account/created/${version}.json`;
      break;
    case EventName.TaskCreated:
      filePath = `./events/tasks/created/${version}.json`;
      break;
    case EventName.TaskUpdated:
      filePath = `./events/tasks/updated/${version}.json`;
      break;
    case EventName.TaskAssigned:
      filePath = `./events/tasks/assigned/${version}.json`;
      break;
    case EventName.TaskCompleted:
      filePath = `./events/tasks/completed/${version}.json`;
      break;
    case EventName.TransactionApplied:
      filePath = `./events/transaction/applied/${version}.json`;
      break;
    case EventName.PaymentCompleted:
      filePath = `./events/payment/completed/${version}.json`;
      break;
    default:
      throw new Error('Invalid event name');
  }

  return filePath;
};

interface JSONData {
  [key: string]: unknown;
}

const readJSON = (jsonPath: string): Promise<JSONData> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, jsonPath), 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const jsonData: JSONData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

