import { cookies } from "next/headers";
import { NAME_COOKIE, ROLE_COOKIE, isRole, type Role } from "./role";

export type Session = { role: Role; name: string | null };

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const role = store.get(ROLE_COOKIE)?.value;
  if (!isRole(role)) return null;
  const name = store.get(NAME_COOKIE)?.value?.trim();
  return { role, name: name ? name.slice(0, 40) : null };
}

// Server Actions are reachable by direct POST, so each one re-checks the role
// rather than relying on the proxy redirect.
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "owner") throw new Error("Only farm owners can do this");
  return session;
}
