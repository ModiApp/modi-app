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
            {
              name: 'firebase/app',
              importNames: ['initializeApp'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing initializeApp directly. This ensures proper initialization and prevents race conditions.',
            },
            {
              name: 'firebase/auth',
              importNames: ['getAuth'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing getAuth directly. This ensures proper initialization and prevents race conditions.',
            },
            {
              name: 'firebase/firestore',
              importNames: ['getFirestore'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing getFirestore directly. This ensures proper initialization and prevents race conditions.',
            },
            {
              name: 'firebase/functions',
              importNames: ['getFunctions'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing getFunctions directly. This ensures proper initialization and prevents race conditions.',
            },
            {
              name: 'firebase/database',
              importNames: ['getDatabase'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing getDatabase directly. This ensures proper initialization and prevents race conditions.',
            },
            {
              name: 'firebase/storage',
              importNames: ['getStorage'],
              message: 'Please import Firebase instances from "@/config/firebase" instead of importing getStorage directly. This ensures proper initialization and prevents race conditions.',
            },
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
