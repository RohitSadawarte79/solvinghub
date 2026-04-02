/// <reference types="next" />

interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends ProcessEnv { }
  }
}
