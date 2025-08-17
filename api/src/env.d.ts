// declare types for process.env
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    HOST?: string;
    FIREBASE_PROJECT_ID?: string;
    GOOGLE_APPLICATION_CREDENTIAL_BASE64?: string;
    ALLOWED_ORIGINS?: string;
    CONNECT_TO_PROD?: string;
    FIREBASE_AUTH_EMULATOR_HOST?: string;
    FIRESTORE_EMULATOR_HOST?: string;
    DEPLOY_URL?: string;
    JEST_WORKER_ID?: string;
  }
}