# AIO Place

AIO Place brings savings goals, a calendar, and focus tools together in one personal dashboard. Made to learn native react along the way and is probably gonna be my passion project till I'm done with it. This is a current work in progress so report any issues in the issues tab if you see one. I'm fairly new to github so it might take a while for me to fix these problems and push some changes.

## Features

- Track multiple savings funds with custom targets, contributions, progress, deadlines, and a pinned goal.
- Plan events on a real month calendar, link calendar dates to fund deadlines, and mark items complete.
- Use a configurable focus timer or stopwatch, with pause/resume and lap timing.
- See total savings, today's agenda, pinned-goal progress, and focus status from the dashboard.
- Keep your data on this device with AsyncStorage. Data is not synced to an account or cloud service.

Money is displayed in Philippine pesos (PHP). Contribution shortcuts use peso-friendly amounts.
*note i will implement a feature to be able to change the currency, but for now I'm sticking to my country's currency :) 

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

You can directly install the apk through the releases tab at the right side of the screen of the repo page. Its a 64x ARM version so it could not work in some devices correctly

Alternatively, its installable APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. Transfer it to your Android phone and open it to install. You may need to allow installs from that file manager or browser. This debug APK is for personal testing, not Google Play distribution.

## Planned Things

- Adding a optional schedule to the focus timer
- Adding the ability to change the currency of your money
- Adding the ability to subtract your funds (just incase you get a little to impulsive playing that one arcade game)
- Adding the ability to add an input on how much exactly you want to add to your funds
- Adding a widget system
- Adding a notification system
- Improve the UI (might make a poll in my discord server for a specific theme)
- More features to improve your day to day life
- Remove some bugs. P.S There's a lot.

If you want to recommend a feature you want to implement in this. Please pm me in discord @musicbyjinyx
