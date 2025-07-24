// since firebase-tools is not a dependency of the functions package, we need to declare the types manually
declare module 'firebase-tools' {
  export const firestore: {
    delete: (path: string, options: { recursive: boolean, force: boolean, project: string }) => Promise<void>;
  };
}