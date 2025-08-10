# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Modi Again - Live Connection Counter

A React Native/Expo app that displays real-time connection counts using Firebase Realtime Database.

## Features

- Real-time connection tracking across multiple devices/browsers
- Live counter showing how many people are currently connected
- Unique connection IDs for each session
- Automatic cleanup when connections are closed

## Quick Start

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set up Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions):
   - Create a Firebase project
   - Enable Realtime Database
   - Update the configuration in `config/firebase.ts`

3. Start the development server:
   ```bash
   yarn start
   ```

4. Open the app in multiple browser tabs to see the connection counter in action!

## Environment Variables (Optional)

For better security, you can use environment variables for Firebase configuration. Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## How It Works

- Each app instance generates a unique connection ID
- Connections are tracked in Firebase Realtime Database
- All clients subscribe to connection changes in real-time
- When a client disconnects (closes tab/app), their connection is automatically removed
- The counter updates instantly across all connected clients

## Project Structure

```
├── app/
│   └── index.tsx              # Main home screen with connection counter
├── components/
│   ├── ThemedText.tsx         # Themed text component
│   └── ThemedView.tsx         # Themed view component
├── config/
│   └── firebase.ts            # Firebase configuration and connection functions
├── hooks/
│   └── useConnectionTracker.ts # Custom hook for connection tracking
└── FIREBASE_SETUP.md          # Detailed Firebase setup instructions
```

## Development

- Built with Expo SDK 53
- Uses Firebase Realtime Database for real-time updates
- TypeScript for type safety
- Themed components for consistent styling
- Yarn Workspaces

### Available Scripts

- `yarn start` - Start the Expo development server
- `yarn dev` - Start Expo + Firebase emulators + API dev server

## Deployment

Deploy the API separately and manage Firestore rules/indexes via `firebase deploy --only firestore` if needed.

### Setting up GitHub Actions

1. **Generate a Firebase CI token:**
   ```bash
   firebase login:ci
   ```
   This will open a browser window for authentication and output a token.

2. **Add the token to GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_TOKEN`
   - Value: Paste the token from step 1

3. **Push to main:**
   The workflow will automatically run when you push to the `main` branch, deploying:
   - Cloud Functions
   - Firestore security rules
   - Firestore indexes

### Manual Deployment

You can also trigger the deployment manually:
- Go to your GitHub repository
- Navigate to Actions → Deploy Firebase
- Click "Run workflow"

## Troubleshooting

If you see a "Firebase not configured" warning:
1. Follow the setup instructions in `FIREBASE_SETUP.md`
2. Make sure your Firebase project has Realtime Database enabled
3. Check that your database URL is correct
4. Verify your security rules allow read/write access

### GitHub Actions Issues

If the deployment fails:
1. Verify your Firebase project ID in `.firebaserc` matches your actual project
2. Ensure your Firebase project has the necessary APIs enabled (Firestore)
3. Check the Actions tab in GitHub for detailed error logs
