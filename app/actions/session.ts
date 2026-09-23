"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NAME_COOKIE, ROLE_COOKIE, isRole } from "@/lib/role";

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
