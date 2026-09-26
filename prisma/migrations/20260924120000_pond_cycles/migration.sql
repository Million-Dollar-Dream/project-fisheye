-- AlterTable
ALTER TABLE "ponds" ADD COLUMN "cycle_months" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "pond_cycles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "stocked_at" DATETIME NOT NULL,
    "stocked_count" INTEGER,
    "ended_at" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL,
    "harvest_kg" REAL,
    "fish_count" INTEGER,
    "cause" TEXT,
    "note" TEXT,
    "feed_kg" REAL NOT NULL,
    "feed_cost_rm" REAL NOT NULL,
    "dead_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pond_cycles_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "pond_cycles_pond_id_number_key" ON "pond_cycles"("pond_id", "number");
