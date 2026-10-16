# My City Connect — Worker Mobile App

This Flutter app is integrated with the **common My City Connect NestJS backend** in `../backend`.

The old Worker-only NestJS/MySQL backend is intentionally not included in this integrated package.

## Run

Android emulator:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Physical Android device on the same network:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_LAN_IP:3001
```

Worker login uses the common JWT authentication endpoint with `employeeId + password`.

The Worker app reads tasks from common `Assignment + Complaint` records and uploads completion proof to the common backend.
