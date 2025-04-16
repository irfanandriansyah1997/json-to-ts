import fs from 'fs';
import path from 'path';

import {
  DEFAULT_CONFIGURATION_FILE,
  DEFAULT_CONFIGURATION_VALUE,
  DEFAULT_MAPPING_CONFIGURATION_KEY
} from '@/constant';
import type { JSONToTSConfigType } from '@/types';

export const getConfiguration = (): JSONToTSConfigType => {
  const configFilePath = path.resolve(
    process.cwd(),
    DEFAULT_CONFIGURATION_FILE
  );
  const result: JSONToTSConfigType = DEFAULT_CONFIGURATION_VALUE;

  try {
    if (fs.existsSync(configFilePath)) {
      const formattedConfig = Object.fromEntries(
        String(fs.readFileSync(configFilePath))
          .split('\n')
          .reduce<Array<Array<string>>>((result, item) => {
            const response = item
              .split('=')
              .map((datum) => datum.trim())
              .filter(Boolean);

            if (response.length === 2) {
              result.push(response);
            }

            return result;
          }, [])
      );

      Object.keys(DEFAULT_MAPPING_CONFIGURATION_KEY).forEach((item) => {
        if (
          Object.prototype.hasOwnProperty.call(formattedConfig, item) &&
          formattedConfig[item]
        ) {
          const { [item]: keyName } = DEFAULT_MAPPING_CONFIGURATION_KEY;
          result[keyName] = formattedConfig[item];
        }
      });
    }

    return result;
  } catch {
    return DEFAULT_CONFIGURATION_VALUE;
  }
};

export const getJSONContentFile = async (
  filePath: string
): Promise<object | undefined> => {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath).toString();

      return JSON.parse(fileContent);
    }

    throw new Error('File is not exists');
  } catch (e) {
    if (e instanceof Error) {
      console.log(`🚨 ${e.message}`);
    }

    return undefined;
  }
};
