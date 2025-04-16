export interface JSONToTSConfigType {
  errorMockFileName: string;
  successMockFileName: string;
  suffixInterfaceName: string;
  suffixOutputFileName: string;
}

export type APIMethodType = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type APIKindType = 'success' | 'error';
