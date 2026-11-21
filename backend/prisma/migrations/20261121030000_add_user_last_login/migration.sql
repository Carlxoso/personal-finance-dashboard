-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Rellena el último acceso con lo que ya registró la bitácora (inicios de sesión y alta del administrador).
UPDATE "User" AS u
SET "lastLoginAt" = a."last"
FROM (
  SELECT "actorId", MAX("createdAt") AS "last"
  FROM "AuditLog"
  WHERE "action" IN ('LOGIN_SUCCESS', 'ADMIN_REGISTERED') AND "actorId" IS NOT NULL
  GROUP BY "actorId"
) AS a
WHERE u."id" = a."actorId";
