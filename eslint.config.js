// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');


module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'functions/lib/*'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...getFirebaseImportPaths(),
          ],
        },
      ],
    },
  },
  {
    files: ['config/firebase.ts', 'functions/src/**/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);

function getFirebaseImportPaths() {
  return [
    ['firebase/app', 'initializeApp'],
    ['firebase/auth', 'getAuth'],
    ['firebase/firestore', 'getFirestore'],
    ['firebase/functions', 'getFunctions'],
    ['firebase/database', 'getDatabase'],
    ['firebase/storage', 'getStorage'],
  ].map(([name, importName]) => ({
    name,
    importNames: [importName],
    message: `Please import Firebase instances from "@/config/firebase" instead of importing ${importName} directly. This ensures proper initialization and prevents race conditions.`,
  }));
}