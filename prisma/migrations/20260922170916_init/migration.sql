-- CreateTable
CREATE TABLE "ponds" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "feed_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "cost_per_unit" REAL NOT NULL,
    "packing_size" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "feed_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "feed_type_id" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    CONSTRAINT "feed_logs_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "feed_logs_feed_type_id_fkey" FOREIGN KEY ("feed_type_id") REFERENCES "feed_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dead_fish_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "tail_count" INTEGER NOT NULL,
    "avg_weight" REAL NOT NULL,
    "kg" REAL NOT NULL,
    CONSTRAINT "dead_fish_records_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feed_inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pond_id" INTEGER NOT NULL,
    "packing_size" REAL NOT NULL,
    "gunny_quantity" REAL NOT NULL,
    "total_weight_kg" REAL NOT NULL,
    CONSTRAINT "feed_inventory_pond_id_fkey" FOREIGN KEY ("pond_id") REFERENCES "ponds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "feed_types_code_key" ON "feed_types"("code");

-- CreateIndex
CREATE INDEX "feed_logs_pond_id_idx" ON "feed_logs"("pond_id");

-- CreateIndex
CREATE INDEX "feed_logs_feed_type_id_idx" ON "feed_logs"("feed_type_id");

-- CreateIndex
CREATE INDEX "dead_fish_records_pond_id_idx" ON "dead_fish_records"("pond_id");

-- CreateIndex
CREATE INDEX "feed_inventory_pond_id_idx" ON "feed_inventory"("pond_id");
