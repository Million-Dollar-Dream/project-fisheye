export type Role = "owner" | "worker";

export const ROLE_COOKIE = "fisheye_role";

export function isRole(value: string | undefined): value is Role {
  return value === "owner" || value === "worker";
}
