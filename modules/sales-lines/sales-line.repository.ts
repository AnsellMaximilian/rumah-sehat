import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import { customers, products, salesLines, suppliers } from "@/db/schema";
import { SalesLineSortBy, SalesLineSortOrder } from "./sales-line.types";

type SalesLineMutationInput = {
  customerId: string;
  productId: string;
  quantity: number;
  unitSellPrice: number | null;
  sourceMode: string;
  supplierId: string | null;
  status: string;
  notes: string | null;
};

function getSalesLineOrderBy(sortBy: SalesLineSortBy, sortOrder: SalesLineSortOrder) {
  const columns = {
    createdAt: salesLines.createdAt,
    customerName: customers.name,
    productName: products.name,
    quantity: salesLines.quantity,
    unitSellPrice: salesLines.unitSellPrice,
    sourceMode: salesLines.sourceMode,
    status: salesLines.status,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildSalesLineSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(customers.customerCode, `%${query}%`),
    ilike(customers.name, `%${query}%`),
    ilike(products.productCode, `%${query}%`),
    ilike(products.name, `%${query}%`),
    ilike(suppliers.name, `%${query}%`),
    ilike(salesLines.status, `%${query}%`),
    ilike(salesLines.sourceMode, `%${query}%`),
    ilike(salesLines.notes, `%${query}%`),
  );
}

function buildBaseSalesLineQuery() {
  const salesLineColumns = getTableColumns(salesLines);

  return db
    .select({
      ...salesLineColumns,
      customerName: customers.name,
      customerCode: customers.customerCode,
      productName: products.name,
      productCode: products.productCode,
      supplierName: suppliers.name,
    })
    .from(salesLines)
    .leftJoin(customers, eq(salesLines.customerId, customers.id))
    .leftJoin(products, eq(salesLines.productId, products.id))
    .leftJoin(suppliers, eq(salesLines.supplierId, suppliers.id));
}

export async function getPaginatedSalesLines(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: SalesLineSortBy;
  sortOrder: SalesLineSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildSalesLineSearchFilter(query);
  const baseQuery = buildBaseSalesLineQuery().where(
    filter ? and(isNull(salesLines.deletedAt), filter) : isNull(salesLines.deletedAt),
  );

  return baseQuery
    .orderBy(getSalesLineOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getSalesLineCount(query: string) {
  const filter = buildSalesLineSearchFilter(query);
  const baseQuery = db
    .select({ count: count() })
    .from(salesLines)
    .leftJoin(customers, eq(salesLines.customerId, customers.id))
    .leftJoin(products, eq(salesLines.productId, products.id))
    .leftJoin(suppliers, eq(salesLines.supplierId, suppliers.id))
    .where(
      filter ? and(isNull(salesLines.deletedAt), filter) : isNull(salesLines.deletedAt),
    );
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getSalesLine(id: string) {
  const [salesLine] = await buildBaseSalesLineQuery().where(
    and(eq(salesLines.id, id), isNull(salesLines.deletedAt)),
  );

  return salesLine;
}

export async function insertSalesLine(input: SalesLineMutationInput) {
  const [salesLine] = await db
    .insert(salesLines)
    .values(input)
    .returning();

  return salesLine;
}

export async function updateSalesLine(
  id: string,
  input: Partial<SalesLineMutationInput>,
) {
  const updateData: Partial<SalesLineMutationInput> = {};

  if (input.customerId !== undefined) updateData.customerId = input.customerId;
  if (input.productId !== undefined) updateData.productId = input.productId;
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.unitSellPrice !== undefined) {
    updateData.unitSellPrice = input.unitSellPrice;
  }
  if (input.sourceMode !== undefined) updateData.sourceMode = input.sourceMode;
  if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const [salesLine] = await db
    .update(salesLines)
    .set(updateData)
    .where(and(eq(salesLines.id, id), isNull(salesLines.deletedAt)))
    .returning();

  return salesLine;
}

export async function softDeleteSalesLine(id: string) {
  const [salesLine] = await db
    .update(salesLines)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(salesLines.id, id), isNull(salesLines.deletedAt)))
    .returning();

  return salesLine;
}
