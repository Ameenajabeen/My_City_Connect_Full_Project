# Citizen UI update

This update preserves the existing backend/API workflow and changes only the Citizen UI flow requested:

- Home header is wrapped in a top SafeArea so the greeting is clearly visible below the phone status bar.
- Added a dedicated GPS Camera screen using the existing `camera` and `geolocator` packages.
- GPS Camera shows live GPS coordinates, accuracy, and reverse-geocoded address while taking the evidence photo.
- The captured GPS data is returned to the Report Issue screen and used for the existing complaint submission flow.
- Added gallery upload and an option to retake the GPS photo or upload a different photo.
- Existing AI image verification is still called after either GPS-camera capture or gallery selection.
- Replaced the AI Help placeholder route with a working chat screen that calls the existing `/chatbot/message` backend endpoint.
- Backend, Officer module, database, and existing complaint APIs were not changed.

Run with a physical Android phone using the PC's Wi-Fi IP, for example:

flutter run --dart-define=API_BASE_URL=http://10.59.233.182:3001 --dart-define=API_WS_URL=ws://10.59.233.182:3001/tracking
