import type { JSONToTSConfigType } from './types';

export const FILE_DIRECTORY_REGEX = /^\.\/(\/?[\w-]+)+\/$/;

/////////////////////////////////////////////////////////////////////////////
// Configuration Constant Section
/////////////////////////////////////////////////////////////////////////////

export const DEFAULT_MAPPING_CONFIGURATION_KEY: Record<
  string,
  keyof JSONToTSConfigType
> = {
  ERROR_MOCK_FILE: 'errorMockFileName',
  SUCCESS_MOCK_FILE: 'successMockFileName',
  SUFFIX_FILE: 'suffixOutputFileName',
  SUFFIX_INTERFACE: 'suffixInterfaceName'
};

export const DEFAULT_CONFIGURATION_FILE = '.jsonrc';

export const DEFAULT_CONFIGURATION_VALUE: JSONToTSConfigType = {
  errorMockFileName: 'error.json',
  successMockFileName: 'success.json',
  suffixInterfaceName: 'APIResponseType',
  suffixOutputFileName: 'contract'
};
