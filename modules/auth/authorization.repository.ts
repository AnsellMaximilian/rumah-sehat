import { db } from "@/db/drizzle";
import {
  permission,
  rolePermission,
  userRole,
  userPermission,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserPermissionsRepository(userId: string) {
  // 1. Permissions via roles
  const rolePermissions = await db
    .select({
      action: permission.action,
      resource: permission.resource,
    })
    .from(userRole)
    .innerJoin(rolePermission, eq(userRole.roleId, rolePermission.roleId))
    .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
    .where(eq(userRole.userId, userId));

  // 2. Direct user permissions
  const directPermissions = await db
    .select({
      action: permission.action,
      resource: permission.resource,
    })
    .from(userPermission)
    .innerJoin(permission, eq(userPermission.permissionId, permission.id))
    .where(eq(userPermission.userId, userId));

  // 3. Merge them
  return [...rolePermissions, ...directPermissions];
}
