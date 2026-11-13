# AIO Place

AIO Place brings savings goals, a calendar, and focus tools together in one personal dashboard.

## Features

- Track multiple savings funds with custom targets, contributions, progress, deadlines, and a pinned goal.
- Plan events on a real month calendar, link calendar dates to fund deadlines, and mark items complete.
- Use a configurable focus timer or stopwatch, with pause/resume and lap timing.
- See total savings, today's agenda, pinned-goal progress, and focus status from the dashboard.
- Keep your data on this device with AsyncStorage. Data is not synced to an account or cloud service.

Money is displayed in Philippine pesos (PHP). Contribution shortcuts use peso-friendly amounts.

## Run locally

```bash
npm install
npm run web
```

For the Expo development menu and native targets, run `npm start`.

## Build an Android APK

Install Android Studio with its Android SDK and a Java 17 JDK, then run these commands from the project root:

```bash
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleDebug
```

The installable APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Transfer it to your Android phone and open it to install. You may need to allow installs from that file manager or browser. This debug APK is for personal testing, not Google Play distribution.
