import { db } from "@/db/drizzle";
import { role, permission, rolePermission, userRole, user } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create super admin role
  const [superAdminRole] = await db
    .insert(role)
    .values({
      id: nanoid(),
      name: "super_admin",
    })
    .onConflictDoNothing()
    .returning();

  // fallback if already exists
  const roleId =
    superAdminRole?.id ??
    (await db.select().from(role).where(eq(role.name, "super_admin")))[0].id;

  // 2. Create permissions
  const permissionsData = [
    { resource: "todos", action: "view" },
    { resource: "todos", action: "create" },
    { resource: "todos", action: "update" },
    { resource: "todos", action: "delete" },
  ];

  const insertedPermissions = [];

  for (const perm of permissionsData) {
    const [created] = await db
      .insert(permission)
      .values({
        id: nanoid(),
        ...perm,
      })
      .onConflictDoNothing()
      .returning();

    const existing =
      created ??
      (
        await db
          .select()
          .from(permission)
          .where(
            and(
              eq(permission.resource, perm.resource),
              eq(permission.action, perm.action),
            ),
          )
      )[0];

    insertedPermissions.push(existing);
  }

  // 3. Assign permissions to role
  for (const perm of insertedPermissions) {
    await db
      .insert(rolePermission)
      .values({
        roleId,
        permissionId: perm.id,
      })
      .onConflictDoNothing();
  }

  // 4. Assign role to a user (IMPORTANT)
  // Change this email to your actual account
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, "superadmin@gmail.com"));

  if (!existingUser) {
    throw new Error("User not found. Create user first.");
  }

  await db
    .insert(userRole)
    .values({
      userId: existingUser.id,
      roleId,
    })
    .onConflictDoNothing();

  console.log("✅ Seeding complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
