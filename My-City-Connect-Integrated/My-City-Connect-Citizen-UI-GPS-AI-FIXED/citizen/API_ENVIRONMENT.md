# Citizen API configuration

Android emulator:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Physical Android device on the same Wi-Fi:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_LAN_IP:3001
```

The citizen app must use the common backend.
