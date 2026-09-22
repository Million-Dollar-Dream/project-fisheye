import { prisma } from "@/lib/prisma";
import QuickEntryForm from "./QuickEntryForm";
import SwitchRoleButton from "../SwitchRoleButton";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const [ponds, feedTypes] = await Promise.all([
    prisma.pond.findMany({ orderBy: { name: "asc" } }),
    prisma.feedType.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black sm:px-8">
      <main className="mx-auto max-w-md">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Log today&apos;s data
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Record feed used and dead fish for a pond.
          </p>
          <div className="mt-2">
            <SwitchRoleButton />
          </div>
        </header>
        <QuickEntryForm ponds={ponds} feedTypes={feedTypes} />
      </main>
    </div>
  );
}
