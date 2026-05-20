import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { permission, role, rolePermission, user, userRole } from "@/db/schema";
import {
  deterministicTextId,
  getStringFlag,
  isSeedVerbose,
  type Seeder,
  type SeederContext,
} from "@/scripts/seed/lib";

const resources = [
  "roles",
  "todos",
  "users",
  "customers",
  "suppliers",
  "product_categories",
  "products",
  "supplier_purchases",
  // "orders",
  // "deliveries",
  // "delivery_charges",
  // "invoices",
  // "currencies",
  // "items",
  // "stock_movements",
  // "stock_receipts",
  // "exchange_rates",
  // "discount_policies",
  // "sales_backfill",
] as const;

const actions = ["view", "create", "update", "delete"] as const;

function buildPermissionsData() {
  return resources.flatMap((resource) =>
    actions.map((action) => ({
      resource,
      action,
    })),
  );
}

const roleDefinitions = {
  super_admin: buildPermissionsData(),
  admin: buildPermissionsData().filter(
    ({ resource }) => resource !== "roles" && resource !== "users",
  ),
  sales: buildPermissionsData().filter(({ resource, action }) => {
    const salesResources = new Set([
      "customers",
      "suppliers",
      "product_categories",
      "products",
      "supplier_purchases",
      // "orders",
      // "deliveries",
      // "delivery_charges",
      // "invoices",
      // "discount_policies",
    ]);

    return salesResources.has(resource) && action !== "delete";
  }),
  
} satisfies Record<string, Array<{ resource: string; action: string }>>;

const DEFAULT_SUPER_ADMIN_EMAIL = "ansellmaximilian@gmail.com";

function logAuthStep(args: SeederContext["args"], message: string) {
  if (!isSeedVerbose(args)) {
    return;
  }

  console.log(`[seed:auth] ${new Date().toISOString()} ${message}`);
}

async function ensureRole(args: SeederContext["args"], roleName: string) {
  logAuthStep(args, `ensureRole:start role=${roleName}`);
  const [existingRole] = await db.select().from(role).where(eq(role.name, roleName));

  if (existingRole) {
    logAuthStep(args, `ensureRole:found role=${roleName}`);
    return existingRole;
  }

  logAuthStep(args, `ensureRole:create role=${roleName}`);
  const [createdRole] = await db
    .insert(role)
    .values({
      id: deterministicTextId("role", roleName),
      name: roleName,
    })
    .returning();

  logAuthStep(args, `ensureRole:created role=${roleName}`);
  return createdRole;
}

async function ensurePermission(
  args: SeederContext["args"],
  resource: string,
  action: string,
) {
  logAuthStep(args, `ensurePermission:start ${resource}:${action}`);
  const [existingPermission] = await db
    .select()
    .from(permission)
    .where(
      and(eq(permission.resource, resource), eq(permission.action, action)),
    );

  if (existingPermission) {
    logAuthStep(args, `ensurePermission:found ${resource}:${action}`);
    return existingPermission;
  }

  logAuthStep(args, `ensurePermission:create ${resource}:${action}`);
  const [createdPermission] = await db
    .insert(permission)
    .values({
      id: deterministicTextId("permission", `${resource}:${action}`),
      resource,
      action,
    })
    .returning();

  logAuthStep(args, `ensurePermission:created ${resource}:${action}`);
  return createdPermission;
}

async function ensureRolePermission(
  args: SeederContext["args"],
  roleId: string,
  permissionId: string,
) {
  logAuthStep(
    args,
    `ensureRolePermission:start roleId=${roleId} permissionId=${permissionId}`,
  );
  const [existingRolePermission] = await db
    .select()
    .from(rolePermission)
    .where(
      and(
        eq(rolePermission.roleId, roleId),
        eq(rolePermission.permissionId, permissionId),
      ),
    );

  if (existingRolePermission) {
    logAuthStep(
      args,
      `ensureRolePermission:found roleId=${roleId} permissionId=${permissionId}`,
    );
    return existingRolePermission;
  }

  logAuthStep(
    args,
    `ensureRolePermission:create roleId=${roleId} permissionId=${permissionId}`,
  );
  const [createdRolePermission] = await db
    .insert(rolePermission)
    .values({
      roleId,
      permissionId,
    })
    .returning();

  logAuthStep(
    args,
    `ensureRolePermission:created roleId=${roleId} permissionId=${permissionId}`,
  );
  return createdRolePermission;
}

async function ensureUserRole(
  args: SeederContext["args"],
  userId: string,
  roleId: string,
) {
  logAuthStep(args, `ensureUserRole:start userId=${userId} roleId=${roleId}`);
  const [existingUserRole] = await db
    .select()
    .from(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)));

  if (existingUserRole) {
    logAuthStep(args, `ensureUserRole:found userId=${userId} roleId=${roleId}`);
    return existingUserRole;
  }

  logAuthStep(args, `ensureUserRole:create userId=${userId} roleId=${roleId}`);
  const [createdUserRole] = await db
    .insert(userRole)
    .values({
      userId,
      roleId,
    })
    .returning();

  logAuthStep(args, `ensureUserRole:created userId=${userId} roleId=${roleId}`);
  return createdUserRole;
}

export async function runAuthSeeder({ args }: SeederContext) {
  console.log("Seeding auth roles and permissions...");
  logAuthStep(args, "run:start");

  for (const [roleName, permissionsData] of Object.entries(roleDefinitions)) {
    logAuthStep(
      args,
      `run:role-begin role=${roleName} permissions=${permissionsData.length}`,
    );
    const seededRole = await ensureRole(args, roleName);

    for (const permissionData of permissionsData) {
      const savedPermission = await ensurePermission(
        args,
        permissionData.resource,
        permissionData.action,
      );

      await ensureRolePermission(args, seededRole.id, savedPermission.id);
    }

    logAuthStep(args, `run:role-complete role=${roleName}`);
  }

  logAuthStep(args, "run:super-admin-role");
  const superAdminRole = await ensureRole(args, "super_admin");
  const explicitSuperAdminEmail = getStringFlag(args, "super-admin-email");
  const configuredSuperAdminEmail =
    explicitSuperAdminEmail ??
    process.env.SUPER_ADMIN_EMAIL ??
    DEFAULT_SUPER_ADMIN_EMAIL;

  logAuthStep(args, `run:lookup-user email=${configuredSuperAdminEmail}`);
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, configuredSuperAdminEmail));

  if (!existingUser) {
    if (explicitSuperAdminEmail) {
      throw new Error(
        `User not found for --super-admin-email=${explicitSuperAdminEmail}`,
      );
    }

    console.log(
      `Skipped super admin assignment. No user found for ${configuredSuperAdminEmail}.`,
    );
    logAuthStep(args, "run:complete without-super-admin-user");
    return;
  }

  await ensureUserRole(args, existingUser.id, superAdminRole.id);
  console.log(`Assigned super_admin to ${configuredSuperAdminEmail}`);
  logAuthStep(args, "run:complete");
}

export const authSeeder: Seeder = {
  name: "auth",
  description: "Seeds roles and permissions for the app",
  run: runAuthSeeder,
};
