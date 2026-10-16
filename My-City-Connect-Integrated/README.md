# My City Connect — Integrated System

This package combines the three supplied modules around one common backend.

```text
Citizen Flutter
      |
      | REST + JWT
      v
Common NestJS Backend :3001
      |
      +--> PostgreSQL (single source of truth)
      +--> MongoDB (AI audit data, optional)
      +--> Object storage / local evidence files
      +--> Socket.IO /tracking
      |
      +--> Officer React Dashboard
      +--> Worker Flutter Android
```

## Folders

- `backend/` — common NestJS backend and Prisma schema
- `citizen/` — Citizen Flutter app
- `officer/` — Officer React/Vite dashboard
- `worker/` — Worker Flutter app

The old Officer-only and Worker-only backend servers were removed from the integrated copy so the three clients cannot accidentally use separate databases.

## 1. Backend

Prerequisites: Node.js, PostgreSQL. MongoDB is needed only for AI audit persistence if that feature is enabled.

```bash
cd backend
npm install
cp .env.example .env
```

Set at least:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mycityconnect?schema=public
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
STORAGE_DRIVER=local
CORS_ORIGIN=http://localhost:5173
```

Generate Prisma Client and apply the migration:

```bash
npx prisma generate
npx prisma migrate deploy
```

For a new local database, the integration migration in `prisma/migrations/20260923210000_unify_worker_officer_completion` is included. If your existing database has never been migrated with Prisma, initialize it using your normal Prisma workflow before applying the integration migration.

Optional demo officer/worker accounts:

```bash
npm run seed:demo
```

Demo accounts:

```text
Officer: officer@mycityconnect.local / Officer@123
Worker:  EMP-1001 / Worker@123
Citizen: register in the Citizen app
```

Start backend:

```bash
npm run start:dev
```

Backend:

```text
http://localhost:3001
Swagger: http://localhost:3001/docs
```

## 2. Officer dashboard

```bash
cd officer
npm install
```

`.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Run:

```bash
npm run dev
```

The dashboard uses the common JWT backend and the `/tracking` Socket.IO namespace.

## 3. Citizen Android app

```bash
cd citizen
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

For a physical phone use the development PC's LAN IP instead of `10.0.2.2`.

## 4. Worker Android app

```bash
cd worker
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Worker login uses `employeeId + password` through the same `/auth/login` endpoint used by the other modules.

## Unified workflow

```text
Citizen registers/logs in
        ↓
Citizen uploads evidence + GPS
        ↓
POST /uploads
        ↓
POST /ai/verify-image (when AI service is available)
        ↓
POST /complaints
        ↓
Duplicate detection + department allocation
        ↓
Officer sees the same Complaint record
        ↓
Officer verifies
        ↓
POST /complaints/:id/assign
        ↓
Assignment + Complaint updated in one database
        ↓
Worker sees GET /workers/me/tasks
        ↓
Worker accepts / travels / arrives / starts work
        ↓
Worker uploads POST /complaints/:id/completion-proof
        ↓
Complaint = WORKER_COMPLETED
Assignment = VERIFICATION
        ↓
Officer reviews proof
        ├── POST /complaints/:id/approve
        │       ↓
        │   Complaint = RESOLVED
        │
        └── POST /complaints/:id/rework
                ↓
            Complaint = REWORK
                ↓
            Worker continues
        ↓
Citizen retrieves the same complaint
        ↓
Citizen submits feedback
```

## Important API groups

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Citizen

```text
POST /uploads
POST /ai/verify-image
POST /complaints
GET  /complaints/my
GET  /complaints/:id
GET  /complaints/:id/timeline
POST /complaints/:id/feedback
POST /feedback
GET  /notifications
```

### Officer

```text
GET  /complaints
GET  /complaints/dashboard-kpis
GET  /complaints/map
POST /complaints/:id/verify
POST /complaints/:id/reject
PATCH /complaints/:id/priority
PATCH /complaints/:id/department
POST /complaints/:id/assign
POST /complaints/:id/review-proof
POST /complaints/:id/approve
POST /complaints/:id/rework
GET  /complaints/:id/feedback
GET  /workers
GET  /workers/available
GET  /workers/:id
GET  /workers/:id/tasks
GET  /workers/:id/location
```

### Worker

```text
GET   /workers/me
GET   /workers/me/tasks
GET   /workers/me/tasks/:id
PATCH /workers/availability
POST  /workers/location
PATCH /assignments/:id/accept
PATCH /assignments/:id/status
POST  /complaints/:id/completion-proof
```

## End-to-end verification checklist

- [ ] Citizen registers
- [ ] Citizen logs in
- [ ] Citizen uploads complaint photo
- [ ] Complaint location is stored
- [ ] Complaint is created in PostgreSQL
- [ ] Duplicate detection runs
- [ ] AI verification is stored when available
- [ ] Officer sees the complaint
- [ ] Officer verifies/rejects
- [ ] Officer assigns an available worker
- [ ] Assignment is stored against the same complaint
- [ ] Worker receives the task
- [ ] Worker changes task state
- [ ] Worker GPS is stored
- [ ] Worker uploads completion proof
- [ ] Complaint becomes `WORKER_COMPLETED`
- [ ] Officer sees proof
- [ ] Officer approves → `RESOLVED`
- [ ] Officer can request rework → `REWORK`
- [ ] Citizen sees the final status
- [ ] Citizen can submit feedback after resolution
- [ ] Officer can read feedback

## Database source of truth

Only the common backend database should be used by the integrated clients.

```text
User
 ├── CitizenProfile
 ├── Officer
 └── Worker

Complaint
 ├── Department
 ├── Assignment
 │    └── Worker
 ├── ComplaintStatusHistory
 ├── CompletionProof
 ├── TrackingLocation
 ├── Notification
 └── Feedback
```
