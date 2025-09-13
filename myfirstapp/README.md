This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

## iOS Widget Setup (Home Screen)

Follow these steps to enable the Home Screen widget with Xcode.

1) Prepare and run the app target
- Open `ios/myfirstapp.xcworkspace` in Xcode.
- Select target `myfirstapp` → `Signing & Capabilities` → choose your Team, set a unique Bundle ID.
- If needed: `cd ios && pod install && cd ..`
- Build & run with `⌘R` to confirm the app launches.

2) Create an App Group (App target)
- `myfirstapp` target → `Signing & Capabilities` → `+ Capability` → add `App Groups`.
- Create a new group, e.g. `group.com.yourname.mymemo`. Copy this exact ID.

3) Add the RN ↔ Widget bridge (App target only)
- Add these two files into the Xcode project under the app target:
  - `myfirstapp/ios-snippets/SharedDefaults.swift`
  - `myfirstapp/ios-snippets/SharedDefaults.m`
- In the add dialog: check “Copy items if needed”, “Create groups”, and only select the App target (do NOT select the widget target).
- Open `SharedDefaults.swift` and replace `groupId` with your App Group ID from step 2.
- If prompted to create a bridging header, accept `Create`.
- Ensure signatures match:
  - ObjC: `RCT_EXTERN_METHOD(setMemos:(NSString *)json)`
  - Swift: `@objc(setMemos:) func setMemos(_ json: String)`

4) Create the Widget Extension target
- File → New → Target… → “Widget Extension (SwiftUI)” → name it `MemoWidget`.
- Select the new `MemoWidget` target → `Signing & Capabilities` → add the SAME App Group as in step 2.

5) Add the widget code (Widget target only)
- Add `myfirstapp/ios-snippets/Widget/MemoWidget.swift` to the widget target (check only `MemoWidget` in the add dialog).
- Open it and replace `groupId` with your App Group ID.
- This snippet is iOS 14+ compatible (uses a simple translucent background).

6) Target Membership and Build Phases sanity check
- Select `SharedDefaults.swift` and `SharedDefaults.m` → File Inspector → Target Membership:
  - `myfirstapp` ✓, `MemoWidget` ✗
- Select `MemoWidget.swift` → Target Membership:
  - `MemoWidget` ✓, `myfirstapp` ✗
- `MemoWidget` target → Build Phases → Compile Sources: only widget Swift files present. Remove any React/folly/Yoga/*.mm/*.cpp files if listed.
- `MemoWidget` target → Build Phases → Link Binary With Libraries: only WidgetKit/SwiftUI/Foundation etc. No React pods here.

7) Build, install, and add the widget
- Product → Clean Build Folder (`Shift+⌘K`).
- Run the app target (`⌘R`).
- Go to the Home Screen → press `+` → search for “메모 위젯” → Add.

8) How it updates
- The app serializes memos to JSON and writes to the App Group via `SharedDefaults` whenever memos change.
- The widget reads `WIDGET_MEMOS` from the App Group and sorts by color priority.

Troubleshooting
- “parameter … not found in the function declaration”: Ensure the ObjC/Swift method signatures match exactly and files are in the App target only.
- Many implicit conversion errors in C/C++ (Yoga/folly): The widget target is accidentally compiling RN sources. Remove them from the widget target’s Compile Sources/Link phases.

<!-- Widget instructions removed to restore a clean RN-only state. -->
