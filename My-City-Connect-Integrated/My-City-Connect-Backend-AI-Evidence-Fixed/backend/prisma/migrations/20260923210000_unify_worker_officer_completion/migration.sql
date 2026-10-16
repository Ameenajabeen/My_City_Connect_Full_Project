-- My City Connect integration migration.
-- Apply after generating Prisma Client from the updated schema.

ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'WORKER_COMPLETED';
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'OFFICER_VERIFICATION';
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'REWORK';

ALTER TYPE "AssignmentStatus" ADD VALUE IF NOT EXISTS 'ON_THE_WAY';
ALTER TYPE "AssignmentStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';
ALTER TYPE "AssignmentStatus" ADD VALUE IF NOT EXISTS 'VERIFICATION';
ALTER TYPE "AssignmentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE TABLE IF NOT EXISTS "Officer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeNumber" TEXT,
  "departmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Officer_userId_key" ON "Officer"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Officer_badgeNumber_key" ON "Officer"("badgeNumber");
CREATE INDEX IF NOT EXISTS "Officer_departmentId_idx" ON "Officer"("departmentId");

ALTER TABLE "Worker" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Worker_employeeId_key" ON "Worker"("employeeId");

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_assignedBy_fkey"
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Officer" ADD CONSTRAINT "Officer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CompletionProof" (
  "id" TEXT NOT NULL,
  "complaintId" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "remarks" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompletionProof_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompletionProof_complaintId_idx" ON "CompletionProof"("complaintId");
CREATE INDEX IF NOT EXISTS "CompletionProof_workerId_idx" ON "CompletionProof"("workerId");

ALTER TABLE "CompletionProof" ADD CONSTRAINT "CompletionProof_complaintId_fkey"
  FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompletionProof" ADD CONSTRAINT "CompletionProof_workerId_fkey"
  FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
