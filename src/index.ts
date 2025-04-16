import input from '@inquirer/input';
import select from '@inquirer/select';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

import { getConfiguration, getJSONContentFile } from './utils/file';
import { capitalizeFirstLetter } from './utils/string';
import { FILE_DIRECTORY_REGEX } from './constant';
import type { APIKindType, APIMethodType } from './types';

interface CreatedContractContentArgs {
  apiMethod: APIMethodType;
  apiName: string;
  mockDirectory: string;
  mockFileName: string;
  mockType: APIKindType;
  suffixInterfaceName: string;
}

const createdContractContent = async (
  args: CreatedContractContentArgs
): Promise<string | undefined> => {
  const {
    apiMethod,
    apiName,
    mockDirectory,
    mockFileName,
    mockType,
    suffixInterfaceName
  } = args;

  const filePath = path.resolve(process.cwd(), mockDirectory, mockFileName);

  try {
    const result = await getJSONContentFile(filePath);

    if (typeof result === 'object') {
      return new Promise<string | undefined>((resolve, reject) => {
        exec(
          `echo '${JSON.stringify(result)}' | npx quicktype --lang ts --just-types --all-properties-optional  --no-date-times --top-level Root`,
          (stdErr, generatedContract) => {
            if (stdErr && stdErr instanceof Error) {
              // Syntax error in input JSON
              if (stdErr.message.includes('Syntax error in input JSON')) {
                reject(new Error('Please give a correct JSON payload'));
                return;
              }

              reject(stdErr.message);
              return;
            }

            const preffixGeneratedInterface = [
              apiMethod,
              apiName,
              mockType
            ].reduce<string>(
              (result, item) => `${result}${capitalizeFirstLetter(item)}`,
              ''
            );

            /**
             * INFO: collect all interface name
             */

            const exposedName = new Set<string>();
            for (const match of generatedContract.matchAll(
              /export interface\s+(\w+)/g
            )) {
              const [, keyword] = match;
              if (typeof keyword === 'string' && keyword) {
                exposedName.add(keyword.replace('export interface ', ''));
              }
            }

            /**
             * INFO: remove all export keep only first export keyword
             */

            let isExportAdding = false;
            let formattedGeneratedContract = generatedContract.replace(
              /export interface/g,
              () => {
                if (!isExportAdding) {
                  isExportAdding = true;
                  return `export interface`;
                }

                return `interface`;
              }
            );

            exposedName.forEach((item) => {
              const dynamicRegex = new RegExp(`\\b(${item})\\b`, 'g');

              formattedGeneratedContract = formattedGeneratedContract.replace(
                dynamicRegex,
                (match) => {
                  return `${preffixGeneratedInterface}${match}${suffixInterfaceName}`;
                }
              );
            });

            if (formattedGeneratedContract) {
              resolve(formattedGeneratedContract);
              return;
            }

            reject('Empty Result');
          }
        );
      });
    }

    return undefined;
  } catch {
    return undefined;
  }
};

interface CreateContractFileArgs {
  apiMethod: APIMethodType;
  apiName: string;
  failureFileMock: string;
  filePath: string;
  successFileMock: string;
  suffixInterfaceName: string;
  suffixOutputFileName: string;
}

const createContractFile = async (
  args: CreateContractFileArgs
): Promise<boolean> => {
  const {
    apiMethod,
    apiName,
    failureFileMock,
    filePath,
    successFileMock,
    suffixInterfaceName,
    suffixOutputFileName
  } = args;
  try {
    const [successContent, failureContent] = await Promise.all([
      createdContractContent({
        apiMethod,
        apiName,
        mockDirectory: filePath,
        mockFileName: successFileMock,
        mockType: 'success',
        suffixInterfaceName: suffixInterfaceName
      }),
      createdContractContent({
        apiMethod,
        apiName,
        mockDirectory: filePath,
        mockFileName: failureFileMock,
        mockType: 'error',
        suffixInterfaceName: suffixInterfaceName
      })
    ]);

    if (!successContent) {
      throw new Error('Error while generate success mock API');
    }

    if (!failureContent) {
      throw new Error('Error while generate error mock API');
    }

    const suffixFileName = [apiMethod, apiName].reduce<string>(
      (result, item) => {
        return `${result}${capitalizeFirstLetter(item)}`;
      },
      ''
    );
    const fileName = `${suffixFileName}.${suffixOutputFileName}.ts`;
    const generatedFilePath = path.resolve(process.cwd(), filePath, fileName);

    /**
     * INFO: delete current interface file
     */
    if (fs.existsSync(generatedFilePath)) {
      fs.unlinkSync(generatedFilePath);
      console.log(`⚠️ Delete "${fileName}" file.`);
    }

    const preffixRootAPIName = [apiMethod, apiName].reduce<string>(
      (result, item) => {
        return `${result}${capitalizeFirstLetter(item)}`;
      },
      ''
    );
    const successRootAPIName = `${preffixRootAPIName}SuccessRoot${suffixInterfaceName}`;
    const errorRootAPIName = `${preffixRootAPIName}ErrorRoot${suffixInterfaceName}`;
    const rootAPIType = `export type ${preffixRootAPIName}Root${suffixInterfaceName} = ${successRootAPIName} | ${errorRootAPIName}`;

    const content = [
      `/* eslint-disable */`,
      `/* tslint:disable */`,
      ``,
      `/**`,
      ` * This file was auto-generated by openapi-typescript.`,
      ` * Do not make direct changes to the file.`,
      ` */`,
      ``,
      `/////////////////////////////////////////////////////////////////////////////`,
      `// Success Contract API`,
      `/////////////////////////////////////////////////////////////////////////////`,
      ``,
      successContent,
      ``,
      `/////////////////////////////////////////////////////////////////////////////`,
      `// Error Contract API`,
      `/////////////////////////////////////////////////////////////////////////////`,
      ``,
      failureContent,
      ``,
      `/////////////////////////////////////////////////////////////////////////////`,
      `// Root API`,
      `/////////////////////////////////////////////////////////////////////////////`,
      ``,
      `${rootAPIType};`
    ];

    fs.writeFileSync(generatedFilePath, content.join('\n'));
    console.log(`✅ Success create contract interface file "${fileName}".`);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  /////////////////////////////////////////////////////////////////////////////
  // Load Configuration
  /////////////////////////////////////////////////////////////////////////////

  const {
    errorMockFileName,
    successMockFileName,
    suffixInterfaceName,
    suffixOutputFileName
  } = getConfiguration();

  /////////////////////////////////////////////////////////////////////////////
  // Collect Inputted User
  /////////////////////////////////////////////////////////////////////////////

  if (
    errorMockFileName &&
    successMockFileName &&
    suffixInterfaceName &&
    suffixOutputFileName
  ) {
    try {
      const apiMethod = await select<APIMethodType>({
        choices: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'PATCH', value: 'PATCH' },
          { name: 'DELETE', value: 'DELETE' }
        ],
        default: 'GET',
        message: 'Select a API Method'
      });

      const apiName = await input({
        message:
          'Put filename path that you want to save the contract API eg. "flight"',
        validate: (value) => Boolean(value)
      });

      const filePath = await input({
        message:
          'Put folder path that you want to save the contract API eg. "./src/lib/"',
        validate: (value) => FILE_DIRECTORY_REGEX.test(value)
      });

      const successMock = await input({
        default: successMockFileName,
        message: `Enter the filename directory where the JSON success mock file is located eg. "${successMockFileName}"`,
        validate: (value) => value.endsWith('.json')
      });

      const errorMock = await input({
        default: errorMockFileName,
        message: `Enter the filename directory where the JSON error mock file is located eg. "${errorMockFileName}"`,
        validate: (value) => value.endsWith('.json')
      });

      const result = createContractFile({
        apiMethod,
        apiName,
        failureFileMock: errorMock,
        filePath,
        successFileMock: successMock,
        suffixInterfaceName,
        suffixOutputFileName
      });

      if (!result) throw new Error();
    } catch {
      console.log('🚨 Failure when parsing your submitted field');
    }

    return;
  }

  console.log(
    '🚨 Your file configuration error please provide correct value on these attributes "SUFFIX_FILE", "SUCCESS_MOCK_FILE", "ERROR_MOCK_FILE"'
  );
};

main();
