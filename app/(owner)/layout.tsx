import { getPondList } from "@/lib/queries";
import { getSession } from "@/lib/session";
import OwnerNav from "./OwnerNav";

export default async function OwnerLayout({ children }: LayoutProps<"/">) {
  const [ponds, session] = await Promise.all([getPondList(), getSession()]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <OwnerNav ponds={ponds} userName={session?.name ?? null} />
      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
