# My City Connect Citizen UI

The Citizen mobile UI is implemented to match the supplied reference screens: dashboard, registered complaints, report civic issue, complaint tracking, and citizen profile.

The UI remains connected to the existing NestJS backend. No backend or Officer module files are included or changed in this folder.

## Physical Android phone

```powershell
flutter pub get
flutter run -d 10BFBL20UH003RY --dart-define=API_BASE_URL=http://10.59.233.182:3001 --dart-define=API_WS_URL=ws://10.59.233.182:3001/tracking
```
