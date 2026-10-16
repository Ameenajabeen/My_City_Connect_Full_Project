# Integration Changes — exact files

## Common backend

### `backend/prisma/schema.prisma`
- Added `Officer` profile linked to `User`.
- Added optional `Worker.employeeId` for unified worker login.
- Added `CompletionProof` linked to Complaint + Worker.
- Added complaint states `WORKER_COMPLETED`, `OFFICER_VERIFICATION`, `REWORK`.
- Added assignment states needed by the existing Worker UI: `ON_THE_WAY`, `ARRIVED`, `VERIFICATION`, `REJECTED`.
- Added `User.assignmentsCreated` / `Assignment.assignedByUser` relationship.

### `backend/prisma/migrations/20260923210000_unify_worker_officer_completion/migration.sql`
- SQL migration for the schema additions.

### `backend/src/auth/dto/login.dto.ts`
- Login accepts citizen/officer email or worker employee ID through one endpoint.

### `backend/src/auth/dto/register.dto.ts`
- Registration DTO retains role/profile fields, but public registration is restricted by service to citizens.

### `backend/src/auth/auth.service.ts`
- Unified JWT login.
- Worker employee-ID login.
- Officer/worker/citizen profile loading.
- Unified `/auth/me`, refresh and logout behavior.

### `backend/src/complaints/complaints.controller.ts`
- Added Officer dashboard, verify/reject, priority, department, assignment, completion-proof, proof review, approve and rework routes.
- Added role protection.

### `backend/src/complaints/complaints.service.ts`
- Added Officer complaint listing/KPIs/map data.
- Added verification/rejection/priority/department operations.
- Added completion proof storage and GPS proximity validation.
- Added officer completion approval/rework.
- Added real-time status broadcasts.
- Added Officer response mapping for existing dashboard field names.

### `backend/src/complaints/complaints.module.ts`
- Connected assignments, notifications, tracking and storage services.

### `backend/src/assignments/assignments.controller.ts`
- Added Officer assignment creation/listing.
- Added Worker accept/status routes.

### `backend/src/assignments/assignments.service.ts`
- Assignment is stored against the common Complaint.
- Worker department/availability validation.
- Worker notification.
- Worker state transitions.
- Complaint status updates at the required workflow points.

### `backend/src/assignments/assignments.module.ts`
- Added notification/tracking dependencies.

### `backend/src/workers/workers.controller.ts`
- Added Officer worker lookup/task/location endpoints.
- Added Worker self/profile/tasks/availability/location endpoints.

### `backend/src/workers/workers.service.ts`
- Common Worker profile and task response.
- Maps `Assignment + Complaint` into the existing Worker `TaskModel` shape.
- Worker location and availability handling.

### `backend/src/workers/workers.module.ts`
- Connected assignments/tracking modules.

### `backend/src/feedback/feedback.controller.ts`
- Added Officer feedback retrieval.
- Preserved citizen submission endpoints.

### `backend/src/feedback/dto/create-feedback-with-complaint.dto.ts`
- Added validated `/feedback` request shape.

### `backend/src/feedback/feedback.service.ts`
- Added complaint feedback retrieval with role checks.

### `backend/src/notifications/notifications.controller.ts`
- Added mark-all-read.

### `backend/src/notifications/notifications.service.ts`
- Added mark-all-read implementation.

### `backend/src/tracking/tracking.gateway.ts`
- Reused `/tracking` Socket.IO namespace.
- Added Officer-compatible events for complaint/status/assignment/worker-location updates.

### `backend/src/ai/ai.controller.ts`
- AI verification is role-protected instead of anonymous.

### `backend/src/uploads/uploads.controller.ts`
- Evidence uploads are role-protected.

### `backend/src/database/prisma.service.ts`
- Database connection failure now stops startup instead of falling back to fake/in-memory data.

### `backend/src/main.ts`
- Serves local evidence files.
- Configurable CORS.

### `backend/.env.example`
- Unified backend environment variables.

### `backend/scripts/seed-demo.js`
- Creates demo Officer and Worker accounts against the common DB.

## Officer dashboard

### `officer/src/services/authService.ts`
- Uses common JWT login and common Officer profile.

### `officer/src/services/complaintService.ts`
- Uses unified complaint routes and response envelopes.
- Uses approval/rework/completion-proof routes.
- Resolves backend evidence URLs.

### `officer/src/services/workerService.ts`
- Uses common Worker endpoints.

### `officer/src/services/assignmentService.ts`
- Uses common assignment status endpoint.

### `officer/src/services/websocketService.ts`
- Connects to the common `/tracking` Socket.IO namespace.

### `officer/src/types/index.ts`
- Added unified complaint/worker fields and workflow states.

### `officer/src/components/common/Badge.tsx`
- Added badges for Worker Completed, Officer Verification and Rework.

### `officer/src/components/complaints/ComplaintStatusTimeline.tsx`
- Added the new workflow states to the existing timeline rank map.

### `officer/package.json`
- Officer is now a pure frontend client; it no longer starts/builds a separate backend.

### `officer/.env.local`
- Points to `http://localhost:3001`.

## Worker mobile app

### `worker/lib/core/config/api_config.dart`
- Common backend base URL with Android emulator/LAN override.

### `worker/lib/repositories/remote/remote_auth_repository.dart`
- Uses common `/auth/login` with employee ID.
- Uses common JWT token and `/auth/me`.

### `worker/lib/services/worker_api_service.dart`
- Uses common `/workers/me/tasks`, `/assignments`, `/workers/location`, `/workers/availability` and `/complaints/:id/completion-proof`.
- No local device path is used for completion evidence.

### `worker/lib/models/task_model.dart`
- Supports the unified Assignment/Complaint task response.

### `worker/README.md`, `SETUP_AND_TEST.md`, `ANDROID_RUN_GUIDE.md`
- Removed old Worker-only backend instructions.

## Citizen mobile app

### `citizen/lib/services/api/api_endpoints.dart`
- Common backend URL and unified routes.

### `citizen/lib/services/api/api_client.dart`
- JWT storage/interceptor and multipart uploads.

### `citizen/lib/repositories/auth_repository.dart`
- Real common-backend register/login/logout/current-user behavior.

### `citizen/lib/repositories/complaint_repository.dart`
- Uploads evidence to common storage first.
- Calls existing AI verification endpoint when available.
- Creates complaint in common backend.
- Reads real complaint data and submits feedback.

### `citizen/lib/models/complaint_model.dart`
- Maps common backend status/category/department/worker/completion-proof fields.

### `citizen/lib/core/screens/login_screen.dart`
- Real backend login.

### `citizen/lib/core/screens/register_screen.dart`
- Real citizen registration.

### `citizen/lib/core/screens/report_issue_screen.dart`
- Real photo + GPS + description + category complaint submission.

### `citizen/lib/core/screens/my_complaints_screen.dart`
- Real complaint list.

### `citizen/lib/core/screens/complaint_details_screen.dart`
- Real complaint status/details/completion proof.

### `citizen/lib/core/screens/feedback_screen.dart`
- Real post-resolution feedback.

### `citizen/lib/core/screens/notifications_screen.dart`
- Real notification feed.

### `citizen/lib/core/routes/app_routes.dart`
- Routes now point to real Citizen screens instead of placeholder screens.

### `citizen/lib/core/screens/home_screen.dart`
- Existing simple UI retained; feature cards now navigate to real functionality.

### `citizen/lib/core/screens/splash_screen.dart`
- Checks the common backend session before choosing login/home.

### `citizen/android/app/src/main/AndroidManifest.xml`
- Added Internet, GPS, camera and local-development cleartext permissions.
