import { getScenario, isLargeScenarioAvailable } from "@/lib/prisma";
import { getPondList } from "@/lib/queries";
import { getSession } from "@/lib/session";
import OwnerNav from "./OwnerNav";

export default async function OwnerLayout({ children }: LayoutProps<"/">) {
  const [ponds, session, scenario, canSwitch] = await Promise.all([
    getPondList(),
    getSession(),
    getScenario(),
    isLargeScenarioAvailable(),
  ]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <OwnerNav
        ponds={ponds.map((pond) => ({ id: pond.id, name: pond.name, farm: pond.farm }))}
        userName={session?.name ?? null}
        scenario={canSwitch ? scenario : null}
      />
      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
