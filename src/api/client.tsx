export interface IApiClient {
  url: string;
  cache: null;
  accountKey?: string;
  apiKey?: string;
  authToken?: string;
  isSSR?: boolean;
  defaultHeaders?: Record<string, string>;
}

export function createApiClient({
  url,
  cache = null,
  accountKey = '', apiKey = '', authToken = '',
  isSSR = false,
  defaultHeaders = {},
}: IApiClient): IApiClient {
  const client = {
    url,
    cache,
    accountKey,
    apiKey,
    authToken,
    isSSR,
    defaultHeaders,
  }
  console.log('ApiClient init ✨', client)
  return client;
}