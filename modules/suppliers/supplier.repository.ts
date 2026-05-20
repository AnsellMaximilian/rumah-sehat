import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { suppliers } from "@/db/schema";
import { SupplierSortBy, SupplierSortOrder } from "./supplier.types";

type SupplierMutationInput = {
  name: string;
  supplierCode: string | null;
  contactInfo: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  notes: string | null;
  active: boolean;
};

function getSupplierOrderBy(
  sortBy: SupplierSortBy,
  sortOrder: SupplierSortOrder,
) {
  const columns = {
    createdAt: suppliers.createdAt,
    supplierCode: suppliers.supplierCode,
    name: suppliers.name,
    bankName: suppliers.bankName,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildSupplierSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(suppliers.name, `%${query}%`),
    ilike(suppliers.supplierCode, `%${query}%`),
    ilike(suppliers.contactInfo, `%${query}%`),
    ilike(suppliers.bankName, `%${query}%`),
    ilike(suppliers.bankAccountName, `%${query}%`),
    ilike(suppliers.bankAccountNumber, `%${query}%`),
    ilike(suppliers.notes, `%${query}%`),
  );
}

export async function getPaginatedSuppliers(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: SupplierSortBy;
  sortOrder: SupplierSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildSupplierSearchFilter(query);
  const baseQuery = filter
    ? db.select().from(suppliers).where(filter)
    : db.select().from(suppliers);

  return baseQuery
    .orderBy(getSupplierOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getSupplierCount(query: string) {
  const filter = buildSupplierSearchFilter(query);
  const baseQuery = filter
    ? db.select({ count: count() }).from(suppliers).where(filter)
    : db.select({ count: count() }).from(suppliers);
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getSupplier(id: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id));

  return supplier;
}

export async function getAllSuppliers() {
  return db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      supplierCode: suppliers.supplierCode,
      active: suppliers.active,
    })
    .from(suppliers)
    .orderBy(asc(suppliers.name));
}

export async function getSupplierByCode(
  supplierCode: string,
  excludeId?: string,
) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(
      excludeId
        ? and(
            eq(suppliers.supplierCode, supplierCode),
            ne(suppliers.id, excludeId),
          )
        : eq(suppliers.supplierCode, supplierCode),
    );

  return supplier;
}

export async function insertSupplier(input: SupplierMutationInput) {
  const [supplier] = await db.insert(suppliers).values(input).returning();

  return supplier;
}

export async function updateSupplier(
  id: string,
  input: Partial<SupplierMutationInput>,
) {
  const updateData: Partial<SupplierMutationInput> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.supplierCode !== undefined) updateData.supplierCode = input.supplierCode;
  if (input.contactInfo !== undefined) updateData.contactInfo = input.contactInfo;
  if (input.bankName !== undefined) updateData.bankName = input.bankName;
  if (input.bankAccountName !== undefined) {
    updateData.bankAccountName = input.bankAccountName;
  }
  if (input.bankAccountNumber !== undefined) {
    updateData.bankAccountNumber = input.bankAccountNumber;
  }
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.active !== undefined) updateData.active = input.active;

  const [supplier] = await db
    .update(suppliers)
    .set(updateData)
    .where(eq(suppliers.id, id))
    .returning();

  return supplier;
}

export async function deleteSupplier(id: string) {
  const [supplier] = await db
    .delete(suppliers)
    .where(eq(suppliers.id, id))
    .returning();

  return supplier;
}
