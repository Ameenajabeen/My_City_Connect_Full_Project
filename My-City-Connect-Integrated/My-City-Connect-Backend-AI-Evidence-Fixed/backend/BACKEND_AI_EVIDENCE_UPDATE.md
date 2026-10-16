# My City Connect Backend - AI Evidence Confidence Update

This package keeps the existing NestJS backend and adds an evidence-confidence layer around the existing AI image verification.

## What changed
- Existing POST `/ai/verify-image` endpoint is preserved.
- Existing FastAPI/YOLO visual classification is preserved.
- Existing `confidence` field remains in the response for compatibility with the current Citizen app.
- Added `visualConfidence` for the raw vision-model score.
- Added evidence fields: `evidenceScore`, `authenticityScore`, `imageQualityScore`, `metadataScore`, `gpsEvidenceScore`, metadata flags, and `sourceEvidence`.
- Optional multipart `latitude` and `longitude` can now be supplied to `/ai/verify-image`.
- Existing MongoDB/in-memory AI audit storage is preserved and can store the new optional evidence fields.
- No new npm dependency was added.

## Important behavior
The backend does not claim that an image is definitely "taken by the user" or definitely "downloaded from Google". Image files can have metadata removed or altered. The new score measures available capture/evidence signals and image quality, and combines those signals with the existing visual model confidence.

The visual model remains the gate: evidence alone cannot turn an image into a civic category. If the FastAPI/YOLO service is offline, the backend continues to use its existing safe fallback instead of inventing a category.

## Verification
TypeScript compilation was checked with:
`npx tsc --noEmit -p tsconfig.json`
and completed without errors in the supplied backend source.
