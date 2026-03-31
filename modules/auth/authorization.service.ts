import { cache } from "react";
import { getUserPermissionsRepository } from "@/modules/auth/authorization.repository";

export const getUserPermissions = cache(async (userId: string) => {
  return await getUserPermissionsRepository(userId);
});

export async function can(userId: string, action: string, resource: string) {
  const permissions = await getUserPermissions(userId);

  return permissions.some(
    (p) => p.action === action && p.resource === resource,
  );
}

export async function requirePermission(
  userId: string,
  action: string,
  resource: string,
) {
  const allowed = await can(userId, action, resource);

  if (!allowed) {
    throw new Error("Forbidden");
  }
}
