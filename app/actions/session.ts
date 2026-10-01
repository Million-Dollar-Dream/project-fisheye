"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { NAME_COOKIE, ROLE_COOKIE, isRole } from "@/lib/role";
import { SCENARIOS, SCENARIO_COOKIE } from "@/lib/scenario";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function signIn(formData: FormData) {
  const role = formData.get("role");
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const next = String(formData.get("next") ?? "");

  if (typeof role !== "string" || !isRole(role)) {
    throw new Error("Choose a role to continue");
  }

  const store = await cookies();
  const options = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" as const, httpOnly: true };
  store.set(ROLE_COOKIE, role, options);
  if (name) store.set(NAME_COOKIE, name, options);
  else store.delete(NAME_COOKIE);

  // Only follow same-site relative paths.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (role === "worker") redirect(safeNext?.startsWith("/log") ? safeNext : "/log");
  redirect(safeNext ?? "/");
}

export async function signOut() {
  const store = await cookies();
  store.delete(ROLE_COOKIE);
  redirect("/select-role");
}

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// Switches between the real farm and the 100-pond demo. Pond and farm ids
// differ between the two, so their pages are left for the section's top page.
export async function setScenario(formData: FormData) {
  const scenario = formData.get("scenario");
  if (typeof scenario !== "string" || !(SCENARIOS as readonly string[]).includes(scenario)) return;
  (await cookies()).set(SCENARIO_COOKIE, scenario, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  const from = String(formData.get("from") ?? "/");
  revalidatePath("/", "layout");
  redirect(
    from.startsWith("/log")
      ? "/log"
      : from.startsWith("/farms/")
        ? "/farms"
        : from.startsWith("/ponds/") || !from.startsWith("/") || from.startsWith("//")
          ? "/"
          : from,
  );
}
