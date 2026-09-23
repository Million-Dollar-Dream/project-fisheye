-- DropIndex
DROP INDEX "dead_fish_records_pond_id_idx";

-- DropIndex
DROP INDEX "feed_inventory_pond_id_idx";

-- DropIndex
DROP INDEX "feed_logs_feed_type_id_idx";

-- DropIndex
DROP INDEX "feed_logs_pond_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "dead_fish_records";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "feed_inventory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "feed_logs";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "feed_type_id" INTEGER,
    "bags" REAL NOT NULL DEFAULT 0,
    "feed_kg" REAL NOT NULL DEFAULT 0,
    "feed_cost_rm" REAL NOT NULL DEFAULT 0,
    "dead_count" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "recorded_by" TEXT,
    "source" TEXT NOT NULL DEFAULT 'app',
    "import_batch_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_logs_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_logs_feed_type_id_fkey" FOREIGN KEY ("feed_type_id") REFERENCES "feed_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "daily_logs_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "samplings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "avg_weight_kg" REAL NOT NULL,
    "sample_size" INTEGER,
    "note" TEXT,
    "recorded_by" TEXT,
    "source" TEXT NOT NULL DEFAULT 'app',
    "import_batch_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "samplings_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "samplings_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "feed_type_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "kind" TEXT NOT NULL,
    "bags" REAL NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_feed_type_id_fkey" FOREIGN KEY ("feed_type_id") REFERENCES "feed_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "imported_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    CONSTRAINT "import_batches_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_feed_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "pack_size_kg" REAL NOT NULL,
    "price_per_kg" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_feed_types" ("id", "code", "pack_size_kg", "price_per_kg") SELECT "id", "code", "packing_size", "cost_per_unit" FROM "feed_types";
DROP TABLE "feed_types";
ALTER TABLE "new_feed_types" RENAME TO "feed_types";
CREATE UNIQUE INDEX "feed_types_code_key" ON "feed_types"("code");
CREATE TABLE "new_ponds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "stocked_at" DATETIME,
    "stocked_count" INTEGER,
    "assumed_fcr" REAL NOT NULL DEFAULT 1.35,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ponds" ("id", "name") SELECT "id", "name" FROM "ponds";
DROP TABLE "ponds";
ALTER TABLE "new_ponds" RENAME TO "ponds";
CREATE UNIQUE INDEX "ponds_name_key" ON "ponds"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "daily_logs_feed_type_id_idx" ON "daily_logs"("feed_type_id");

-- CreateIndex
CREATE INDEX "daily_logs_import_batch_id_idx" ON "daily_logs"("import_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_logs_pond_id_date_key" ON "daily_logs"("pond_id", "date");

-- CreateIndex
CREATE INDEX "samplings_pond_id_date_idx" ON "samplings"("pond_id", "date");

-- CreateIndex
CREATE INDEX "samplings_import_batch_id_idx" ON "samplings"("import_batch_id");

-- CreateIndex
CREATE INDEX "stock_movements_feed_type_id_date_idx" ON "stock_movements"("feed_type_id", "date");

-- CreateIndex
CREATE INDEX "import_batches_pond_id_idx" ON "import_batches"("pond_id");

