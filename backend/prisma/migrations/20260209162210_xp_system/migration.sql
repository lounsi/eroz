/*
  Warnings:

  - You are about to drop the column `score` on the `TrainingSession` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `TrainingSession` table. All the data in the column will be lost.
  - Added the required column `baseScore` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correctAnswers` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difficulty` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `multiplier` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precision` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalImages` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xpEarned` to the `TrainingSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "precision" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalImages" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "baseScore" INTEGER NOT NULL,
    "multiplier" REAL NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TrainingSession" ("completedAt", "duration", "id", "userId") SELECT "completedAt", "duration", "id", "userId" FROM "TrainingSession";
DROP TABLE "TrainingSession";
ALTER TABLE "new_TrainingSession" RENAME TO "TrainingSession";
CREATE TABLE "new_UserStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "averageScore" REAL NOT NULL DEFAULT 0,
    "averageTime" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" DATETIME,
    CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStats" ("averageScore", "averageTime", "currentStreak", "id", "lastActivityAt", "totalSessions", "userId") SELECT "averageScore", "averageTime", "currentStreak", "id", "lastActivityAt", "totalSessions", "userId" FROM "UserStats";
DROP TABLE "UserStats";
ALTER TABLE "new_UserStats" RENAME TO "UserStats";
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
