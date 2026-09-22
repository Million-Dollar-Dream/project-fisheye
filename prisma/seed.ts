import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// Feed types and pricing derived from the Pond 1 CSV feed-cost breakdown tables.
const feedTypes = [
  { code: "SM0120", packingSize: 20, costPerUnit: 4.35 },
  { code: "SM0125", packingSize: 25, costPerUnit: 4.35 },
  { code: "SM0220", packingSize: 20, costPerUnit: 4.05 },
  { code: "SM0320", packingSize: 20, costPerUnit: 3.85 },
  { code: "SM0420", packingSize: 20, costPerUnit: 3.8 },
  { code: "UP02", packingSize: 20, costPerUnit: 4.05 },
  { code: "UP03", packingSize: 20, costPerUnit: 3.8 },
  { code: "UP04", packingSize: 20, costPerUnit: 3.75 },
];

// A few weeks of feed logs for Pond 1, taken from the Dec-25 / Jan-26 / Feb-26
// monthly feed log tables in the source CSV.
const pond1FeedLogs = [
  { date: "2025-12-27", code: "SM0120", quantity: 1 },
  { date: "2026-01-14", code: "SM0125", quantity: 1 },
  { date: "2026-01-20", code: "SM0125", quantity: 1 },
  { date: "2026-01-25", code: "SM0125", quantity: 1 },
  { date: "2026-01-29", code: "SM0125", quantity: 1 },
  { date: "2026-01-31", code: "SM0125", quantity: 1 },
  { date: "2026-02-04", code: "SM0125", quantity: 1 },
  { date: "2026-02-06", code: "SM0125", quantity: 1 },
  { date: "2026-02-09", code: "SM0125", quantity: 1 },
  { date: "2026-02-11", code: "SM0220", quantity: 1 },
];

const pond1DeadFish = [
  { date: "2025-12-31", tailCount: 1, avgWeight: 0.0001, kg: 0.0001 },
  { date: "2026-01-31", tailCount: 18, avgWeight: 0.005, kg: 0.09 },
  { date: "2026-02-28", tailCount: 6, avgWeight: 0.05, kg: 0.3 },
  { date: "2026-03-31", tailCount: 12, avgWeight: 0.15, kg: 1.8 },
  { date: "2026-04-30", tailCount: 6, avgWeight: 0.25, kg: 1.5 },
];

const pond1Inventory = [
  { packingSize: 25, gunnyQuantity: 14, totalWeightKg: 350 },
  { packingSize: 20, gunnyQuantity: 257.5, totalWeightKg: 5150 },
];

async function main() {
  const pond1 = await prisma.pond.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Pond 1", capacity: 5000 },
  });

  const pond2 = await prisma.pond.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "Pond 2", capacity: 6000 },
  });

  const feedTypeByCode = new Map<string, number>();
  for (const feedType of feedTypes) {
    const created = await prisma.feedType.upsert({
      where: { code: feedType.code },
      update: {},
      create: feedType,
    });
    feedTypeByCode.set(feedType.code, created.id);
  }

  for (const log of pond1FeedLogs) {
    const feedTypeId = feedTypeByCode.get(log.code);
    if (!feedTypeId) continue;
    await prisma.feedLog.create({
      data: {
        pondId: pond1.id,
        feedTypeId,
        date: new Date(log.date),
        quantity: log.quantity,
      },
    });
  }

  for (const record of pond1DeadFish) {
    await prisma.deadFishRecord.create({
      data: {
        pondId: pond1.id,
        date: new Date(record.date),
        tailCount: record.tailCount,
        avgWeight: record.avgWeight,
        kg: record.kg,
      },
    });
  }

  for (const item of pond1Inventory) {
    await prisma.feedInventory.create({
      data: {
        pondId: pond1.id,
        packingSize: item.packingSize,
        gunnyQuantity: item.gunnyQuantity,
        totalWeightKg: item.totalWeightKg,
      },
    });
  }

  console.log(`Seeded ${feedTypes.length} feed types, ponds ${pond1.name} and ${pond2.name}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
