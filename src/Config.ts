function getEnv(key: string): string {
  const store: Record<string, string> = import.meta.env || process.env;
  const prefix = 'VITE_';
  return store[`${prefix}${key}`];
}

// const isProduction = import.meta.env.PROD;
const isProduction = true;

console.log('isProduction', isProduction);

function getBool(key: string, defaultValue: boolean): boolean {
  const val = getEnv(key) || `${defaultValue}`;
  return ['true', '1', 'yes'].includes(val.toLowerCase());
}

function getStr(key: string, defaultValue: string): string {
  const val = getEnv(key) || defaultValue;
  return val;
}

export const Config = {
  isProduction,
  strictMode: getBool('STRICT_MODE', false),
  accountKey: '',
  apiKey: '',
  apiUrl: '',
}