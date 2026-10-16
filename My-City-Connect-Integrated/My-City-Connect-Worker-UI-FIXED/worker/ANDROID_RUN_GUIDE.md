# Android Run Guide — Integrated System

The Worker app no longer starts its own backend.

Common backend:

```text
http://localhost:3001
```

Android emulator:

```text
http://10.0.2.2:3001
```

Physical device:

```text
http://YOUR_PC_LAN_IP:3001
```

Run:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```
