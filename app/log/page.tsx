import Link from "next/link";
import { prisma } from "@/lib/prisma";
import QuickEntryForm from "./QuickEntryForm";
import SwitchRoleButton from "../SwitchRoleButton";
import { AppHeader, ArrowLeftIcon, CalendarIcon } from "../ui";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const [ponds, feedTypes] = await Promise.all([
    prisma.pond.findMany({ orderBy: { name: "asc" } }),
    prisma.feedType.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-stone-950">
      <AppHeader>
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 sm:flex dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ArrowLeftIcon className="size-3.5" />
          Dashboard
        </Link>
        <SwitchRoleButton />
      </AppHeader>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 sm:hidden dark:text-stone-400 dark:hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          Dashboard
        </Link>
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CalendarIcon className="size-4" />
            Daily entry
          </div>
          <h1 className="text-balance text-3xl font-semibold text-stone-950 sm:text-4xl dark:text-white">
            Log today&apos;s data
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm leading-6 text-stone-500 dark:text-stone-400">
            Select a pond, then record feed usage or fish deaths. Each section saves independently.
          </p>
        </header>
        <QuickEntryForm ponds={ponds} feedTypes={feedTypes} />
      </main>
    </div>
  );
}
