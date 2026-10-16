# My City Connect Worker UI

The Worker mobile UI is implemented to match the supplied reference screens: dashboard, task details, active task, and completion proof.

The existing Worker REST workflow is preserved: authentication, assignments, status transitions, worker availability/location, and completion-proof upload all use the common NestJS backend. No backend or Officer module files are included or changed in this folder.

## Physical Android phone

```powershell
flutter pub get
flutter run -d 10BFBL20UH003RY --dart-define=API_BASE_URL=http://10.59.233.182:3001 --dart-define=API_WS_URL=ws://10.59.233.182:3001/tracking
```
