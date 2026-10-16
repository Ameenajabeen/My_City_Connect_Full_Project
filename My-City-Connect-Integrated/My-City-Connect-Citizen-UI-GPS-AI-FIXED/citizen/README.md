# My City Connect — Citizen Mobile App

This Flutter app is connected to the common NestJS backend in `../backend`.

## Android emulator

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

## Physical Android device

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_LAN_IP:3001
```

Citizen flow now uses the real backend:

- Register / login
- Upload complaint photo
- AI image verification when the AI service is available
- GPS/location capture
- Create complaint
- View complaint status
- View completion proof and remarks
- Submit post-resolution feedback
- View notifications

No local device file path is stored as complaint evidence; the backend returns a storage URL.
