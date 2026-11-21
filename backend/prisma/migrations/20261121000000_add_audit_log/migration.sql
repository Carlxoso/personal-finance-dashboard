-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ADMIN_REGISTERED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'PROFILE_UPDATED', 'USER_CREATED', 'USER_PASSWORD_RESET', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'ACCESS_DENIED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "targetId" TEXT,
    "targetEmail" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
