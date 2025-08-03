// declare types for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;
    HOST: string;
    FIREBASE_PROJECT_ID: string;
    GOOGLE_APPLICATION_CREDENTIAL: string;
  }
}