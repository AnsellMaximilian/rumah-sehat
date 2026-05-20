import { and, asc, count, desc, eq, getTableColumns, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  customers,
  products,
  supplierPurchaseItems,
  supplierPurchases,
  suppliers,
  user,
} from "@/db/schema";
import {
  SupplierPurchaseSortBy,
  SupplierPurchaseSortOrder,
} from "./supplier-purchase.types";

type SupplierPurchaseMutationInput = {
  supplierId: string;
  purchaseDate: string;
  referenceNumber: string | null;
  status: string;
  notes: string | null;
  createdBy: string;
};

type SupplierPurchaseItemMutationInput = {
  productId: string;
  quantity: number;
  unitCost: number | null;
  destinationType: string;
  customerId: string | null;
  notes: string | null;
};

function getSupplierPurchaseOrderBy(
  sortBy: SupplierPurchaseSortBy,
  sortOrder: SupplierPurchaseSortOrder,
) {
  const columns = {
    createdAt: supplierPurchases.createdAt,
    purchaseDate: supplierPurchases.purchaseDate,
    referenceNumber: supplierPurchases.referenceNumber,
    status: supplierPurchases.status,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildSupplierPurchaseSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(suppliers.name, `%${query}%`),
    ilike(supplierPurchases.referenceNumber, `%${query}%`),
    ilike(supplierPurchases.status, `%${query}%`),
    ilike(supplierPurchases.notes, `%${query}%`),
  );
}

export async function getPaginatedSupplierPurchases(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: SupplierPurchaseSortBy;
  sortOrder: SupplierPurchaseSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildSupplierPurchaseSearchFilter(query);
  const purchaseColumns = getTableColumns(supplierPurchases);
  const baseQuery = filter
    ? db
        .select({
          ...purchaseColumns,
          supplierName: suppliers.name,
          createdByName: user.name,
        })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .leftJoin(user, eq(supplierPurchases.createdBy, user.id))
        .where(filter)
    : db
        .select({
          ...purchaseColumns,
          supplierName: suppliers.name,
          createdByName: user.name,
        })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .leftJoin(user, eq(supplierPurchases.createdBy, user.id));

  return baseQuery
    .orderBy(getSupplierPurchaseOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getSupplierPurchaseCount(query: string) {
  const filter = buildSupplierPurchaseSearchFilter(query);
  const baseQuery = filter
    ? db
        .select({ count: count() })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
        .where(filter)
    : db
        .select({ count: count() })
        .from(supplierPurchases)
        .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id));
  const [{ count: countResult }] = await baseQuery;

  return countResult;
}

export async function getSupplierPurchase(id: string) {
  const purchaseColumns = getTableColumns(supplierPurchases);
  const [supplierPurchase] = await db
    .select({
      ...purchaseColumns,
      supplierName: suppliers.name,
      createdByName: user.name,
    })
    .from(supplierPurchases)
    .leftJoin(suppliers, eq(supplierPurchases.supplierId, suppliers.id))
    .leftJoin(user, eq(supplierPurchases.createdBy, user.id))
    .where(eq(supplierPurchases.id, id));

  return supplierPurchase;
}

export async function getSupplierPurchaseItems(supplierPurchaseId: string) {
  const itemColumns = getTableColumns(supplierPurchaseItems);

  return db
    .select({
      ...itemColumns,
      productName: products.name,
      productCode: products.productCode,
      customerName: customers.name,
      customerCode: customers.customerCode,
    })
    .from(supplierPurchaseItems)
    .leftJoin(products, eq(supplierPurchaseItems.productId, products.id))
    .leftJoin(customers, eq(supplierPurchaseItems.customerId, customers.id))
    .where(eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchaseId))
    .orderBy(asc(supplierPurchaseItems.createdAt));
}

export async function getSupplierPurchaseByReferenceNumber(
  referenceNumber: string,
  excludeId?: string,
) {
  const [supplierPurchase] = await db
    .select()
    .from(supplierPurchases)
    .where(
      excludeId
        ? and(
            eq(supplierPurchases.referenceNumber, referenceNumber),
            ne(supplierPurchases.id, excludeId),
          )
        : eq(supplierPurchases.referenceNumber, referenceNumber),
    );

  return supplierPurchase;
}

export async function insertSupplierPurchase(input: {
  purchase: SupplierPurchaseMutationInput;
  items: SupplierPurchaseItemMutationInput[];
}) {
  return db.transaction(async (tx) => {
    const [supplierPurchase] = await tx
      .insert(supplierPurchases)
      .values(input.purchase)
      .returning();

    if (input.items.length > 0) {
      await tx.insert(supplierPurchaseItems).values(
        input.items.map((item) => ({
          supplierPurchaseId: supplierPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          destinationType: item.destinationType,
          customerId: item.customerId,
          notes: item.notes,
        })),
      );
    }

    return supplierPurchase;
  });
}

export async function updateSupplierPurchase(
  id: string,
  input: {
    purchase: Omit<SupplierPurchaseMutationInput, "createdBy">;
    items: SupplierPurchaseItemMutationInput[];
  },
) {
  return db.transaction(async (tx) => {
    const [supplierPurchase] = await tx
      .update(supplierPurchases)
      .set(input.purchase)
      .where(eq(supplierPurchases.id, id))
      .returning();

    await tx
      .delete(supplierPurchaseItems)
      .where(eq(supplierPurchaseItems.supplierPurchaseId, id));

    if (input.items.length > 0) {
      await tx.insert(supplierPurchaseItems).values(
        input.items.map((item) => ({
          supplierPurchaseId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          destinationType: item.destinationType,
          customerId: item.customerId,
          notes: item.notes,
        })),
      );
    }

    return supplierPurchase;
  });
}

export async function deleteSupplierPurchase(id: string) {
  const [supplierPurchase] = await db
    .delete(supplierPurchases)
    .where(eq(supplierPurchases.id, id))
    .returning();

  return supplierPurchase;
}
