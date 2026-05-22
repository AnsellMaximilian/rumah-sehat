import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  notInArray,
  or,
} from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  customers,
  deliveryCharges,
  deliveryItems,
  deliveries,
  invoiceItems,
  invoices,
  products,
  salesLines,
  supplierPurchaseItems,
  supplierPurchases,
  user,
} from "@/db/schema";
import { InvoiceSortBy, InvoiceSortOrder } from "./invoice.types";

type InvoiceMutationInput = {
  customerId: string;
  invoiceNumber: string | null;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  status: string;
  syncStatus: string;
  notes: string | null;
  createdBy: string;
};

type InvoiceItemMutationInput = {
  lineType: string;
  description: string;
  productId: string | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
  sourceType: string | null;
  sourceId: string | null;
};

function getInvoiceOrderBy(sortBy: InvoiceSortBy, sortOrder: InvoiceSortOrder) {
  const columns = {
    createdAt: invoices.createdAt,
    invoiceDate: invoices.invoiceDate,
    invoiceNumber: invoices.invoiceNumber,
    customerName: customers.name,
    status: invoices.status,
    syncStatus: invoices.syncStatus,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildInvoiceSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(customers.customerCode, `%${query}%`),
    ilike(customers.name, `%${query}%`),
    ilike(invoices.invoiceNumber, `%${query}%`),
    ilike(invoices.status, `%${query}%`),
    ilike(invoices.syncStatus, `%${query}%`),
    ilike(invoices.notes, `%${query}%`),
  );
}

function buildBaseInvoiceQuery() {
  const invoiceColumns = getTableColumns(invoices);

  return db
    .select({
      ...invoiceColumns,
      customerCode: customers.customerCode,
      customerName: customers.name,
      createdByName: user.name,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(user, eq(invoices.createdBy, user.id));
}

export async function getPaginatedInvoices(input: {
  page: number;
  limit: number;
  query: string;
  sortBy: InvoiceSortBy;
  sortOrder: InvoiceSortOrder;
}) {
  const { page, limit, query, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;
  const filter = buildInvoiceSearchFilter(query);

  return buildBaseInvoiceQuery()
    .where(filter ? and(isNull(invoices.deletedAt), filter) : isNull(invoices.deletedAt))
    .orderBy(getInvoiceOrderBy(sortBy, sortOrder))
    .limit(limit)
    .offset(offset);
}

export async function getInvoiceCount(query: string) {
  const filter = buildInvoiceSearchFilter(query);
  const [{ count: countResult }] = await db
    .select({ count: count() })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(filter ? and(isNull(invoices.deletedAt), filter) : isNull(invoices.deletedAt));

  return countResult;
}

export async function getInvoice(id: string) {
  const [invoice] = await buildBaseInvoiceQuery().where(
    and(eq(invoices.id, id), isNull(invoices.deletedAt)),
  );

  return invoice;
}

export async function getInvoiceItems(invoiceId: string) {
  const itemColumns = getTableColumns(invoiceItems);

  return db
    .select({
      ...itemColumns,
      productCode: products.productCode,
      productName: products.name,
    })
    .from(invoiceItems)
    .leftJoin(products, eq(invoiceItems.productId, products.id))
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.createdAt));
}

export async function getInvoiceByNumber(invoiceNumber: string, excludeId?: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      excludeId
        ? and(
            eq(invoices.invoiceNumber, invoiceNumber),
            ne(invoices.id, excludeId),
            isNull(invoices.deletedAt),
          )
        : and(eq(invoices.invoiceNumber, invoiceNumber), isNull(invoices.deletedAt)),
    );

  return invoice;
}

export async function getInvoiceForCustomerPeriod(input: {
  customerId: string;
  periodStart: string;
  periodEnd: string;
  excludeId?: string;
}) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, input.customerId),
        eq(invoices.periodStart, input.periodStart),
        eq(invoices.periodEnd, input.periodEnd),
        isNull(invoices.deletedAt),
        ne(invoices.status, "void"),
        input.excludeId ? ne(invoices.id, input.excludeId) : undefined,
      ),
    );

  return invoice;
}

export async function getDeliveredSalesLinesForCustomer(customerId: string) {
  return db
    .select({
      id: salesLines.id,
      customerId: salesLines.customerId,
      customerCode: customers.customerCode,
      customerName: customers.name,
      productId: salesLines.productId,
      productCode: products.productCode,
      productName: products.name,
      quantity: salesLines.quantity,
      unitSellPrice: salesLines.unitSellPrice,
      status: salesLines.status,
      deliveryRecordedAt: deliveries.recordedAt,
      deliveryDeliveredAt: deliveries.deliveredAt,
      supplierPurchaseDate: supplierPurchases.purchaseDate,
      updatedAt: salesLines.updatedAt,
    })
    .from(salesLines)
    .leftJoin(customers, eq(salesLines.customerId, customers.id))
    .leftJoin(products, eq(salesLines.productId, products.id))
    .leftJoin(
      supplierPurchaseItems,
      eq(salesLines.sourceSupplierPurchaseItemId, supplierPurchaseItems.id),
    )
    .leftJoin(
      supplierPurchases,
      eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchases.id),
    )
    .leftJoin(
      deliveryItems,
      and(
        eq(deliveryItems.salesLineId, salesLines.id),
        isNull(deliveryItems.deletedAt),
      ),
    )
    .leftJoin(
      deliveries,
      and(
        eq(deliveryItems.deliveryId, deliveries.id),
        isNull(deliveries.deletedAt),
      ),
    )
    .where(
      and(
        eq(salesLines.customerId, customerId),
        eq(salesLines.status, "delivered"),
        isNull(salesLines.deletedAt),
      ),
    );
}

export async function getDeliveredSalesLinesForPreview(customerId: string) {
  return db
    .select({
      id: salesLines.id,
      customerId: salesLines.customerId,
      customerCode: customers.customerCode,
      customerName: customers.name,
      productId: salesLines.productId,
      productCode: products.productCode,
      productName: products.name,
      quantity: salesLines.quantity,
      unitSellPrice: salesLines.unitSellPrice,
      status: salesLines.status,
      deliveryRecordedAt: deliveries.recordedAt,
      deliveryDeliveredAt: deliveries.deliveredAt,
      supplierPurchaseDate: supplierPurchases.purchaseDate,
      updatedAt: salesLines.updatedAt,
    })
    .from(salesLines)
    .leftJoin(customers, eq(salesLines.customerId, customers.id))
    .leftJoin(products, eq(salesLines.productId, products.id))
    .leftJoin(
      supplierPurchaseItems,
      eq(salesLines.sourceSupplierPurchaseItemId, supplierPurchaseItems.id),
    )
    .leftJoin(
      supplierPurchases,
      eq(supplierPurchaseItems.supplierPurchaseId, supplierPurchases.id),
    )
    .leftJoin(
      deliveryItems,
      and(
        eq(deliveryItems.salesLineId, salesLines.id),
        isNull(deliveryItems.deletedAt),
      ),
    )
    .leftJoin(
      deliveries,
      and(
        eq(deliveryItems.deliveryId, deliveries.id),
        isNull(deliveries.deletedAt),
      ),
    )
    .where(
      and(
        eq(salesLines.customerId, customerId),
        eq(salesLines.status, "delivered"),
        isNull(salesLines.deletedAt),
      ),
    );
}

export async function getBillableDeliveryChargesForPreview(customerId: string) {
  return db
    .select({
      id: deliveryCharges.id,
      deliveryId: deliveryCharges.deliveryId,
      customerId: customers.id,
      customerCode: customers.customerCode,
      customerName: customers.name,
      chargeType: deliveryCharges.chargeType,
      description: deliveryCharges.description,
      amount: deliveryCharges.amount,
      deliveryRecordedAt: deliveries.recordedAt,
      deliveryDeliveredAt: deliveries.deliveredAt,
    })
    .from(deliveryCharges)
    .innerJoin(deliveries, eq(deliveryCharges.deliveryId, deliveries.id))
    .leftJoin(customers, eq(deliveries.customerId, customers.id))
    .where(
      and(
        eq(deliveries.customerId, customerId),
        eq(deliveries.status, "delivered"),
        eq(deliveryCharges.billToCustomer, true),
        isNull(deliveryCharges.deletedAt),
        isNull(deliveries.deletedAt),
      ),
    );
}

export async function getExistingInvoicedSourceIds(input: {
  excludeInvoiceId?: string;
  sourceType: "sales_line" | "delivery_charge";
  sourceIds: string[];
}) {
  if (input.sourceIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      sourceId: invoiceItems.sourceId,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      and(
        eq(invoiceItems.sourceType, input.sourceType),
        inArray(invoiceItems.sourceId, input.sourceIds),
        isNull(invoices.deletedAt),
        notInArray(invoices.status, ["void"]),
        input.excludeInvoiceId ? ne(invoices.id, input.excludeInvoiceId) : undefined,
      ),
    );

  return rows
    .map((row) => row.sourceId)
    .filter((value): value is string => value !== null);
}


export async function insertInvoiceItem(input: InvoiceItemMutationInput & {
  invoiceId: string;
}) {
  const [invoiceItem] = await db
    .insert(invoiceItems)
    .values({
      invoiceId: input.invoiceId,
      lineType: input.lineType,
      description: input.description,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      amount: input.amount,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    })
    .returning();

  return invoiceItem;
}

export async function insertInvoice(input: {
  invoice: InvoiceMutationInput;
  items: InvoiceItemMutationInput[];
}) {
  return db.transaction(async (tx) => {
    const [invoice] = await tx.insert(invoices).values(input.invoice).returning();

    if (input.items.length > 0) {
      await tx.insert(invoiceItems).values(
        input.items.map((item) => ({
          invoiceId: invoice.id,
          lineType: item.lineType,
          description: item.description,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
        })),
      );
    }

    return invoice;
  });
}

export async function updateInvoice(
  id: string,
  input: Partial<Omit<InvoiceMutationInput, "customerId" | "periodStart" | "periodEnd" | "createdBy">>,
) {
  const [invoice] = await db
    .update(invoices)
    .set(input)
    .where(and(eq(invoices.id, id), isNull(invoices.deletedAt)))
    .returning();

  return invoice;
}

export async function replaceInvoiceItems(
  invoiceId: string,
  items: InvoiceItemMutationInput[],
) {
  return db.transaction(async (tx) => {
    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    if (items.length > 0) {
      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId,
          lineType: item.lineType,
          description: item.description,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
        })),
      );
    }

    const [invoice] = await tx
      .update(invoices)
      .set({
        syncStatus: "current",
      })
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
      .returning();

    return invoice;
  });
}

export async function voidInvoiceAndInsertReplacement(input: {
  invoiceId: string;
  replacementInvoice: InvoiceMutationInput;
  replacementItems: InvoiceItemMutationInput[];
}) {
  return db.transaction(async (tx) => {
    const [voidedInvoice] = await tx
      .update(invoices)
      .set({
        status: "void",
        syncStatus: "current",
      })
      .where(and(eq(invoices.id, input.invoiceId), isNull(invoices.deletedAt)))
      .returning();

    const [replacementInvoice] = await tx
      .insert(invoices)
      .values(input.replacementInvoice)
      .returning();

    if (input.replacementItems.length > 0) {
      await tx.insert(invoiceItems).values(
        input.replacementItems.map((item) => ({
          invoiceId: replacementInvoice.id,
          lineType: item.lineType,
          description: item.description,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
        })),
      );
    }

    return {
      replacementInvoice,
      voidedInvoice,
    };
  });
}

export async function softDeleteInvoice(id: string) {
  const [invoice] = await db
    .update(invoices)
    .set({ deletedAt: new Date() })
    .where(and(eq(invoices.id, id), isNull(invoices.deletedAt)))
    .returning();

  return invoice;
}

export async function markInvoicesNeedsReviewBySources(input: {
  deliveryChargeIds?: string[];
  salesLineIds?: string[];
}) {
  const sourcePredicates = [];

  if (input.salesLineIds && input.salesLineIds.length > 0) {
    sourcePredicates.push(
      and(
        eq(invoiceItems.sourceType, "sales_line"),
        inArray(invoiceItems.sourceId, input.salesLineIds),
      ),
    );
  }

  if (input.deliveryChargeIds && input.deliveryChargeIds.length > 0) {
    sourcePredicates.push(
      and(
        eq(invoiceItems.sourceType, "delivery_charge"),
        inArray(invoiceItems.sourceId, input.deliveryChargeIds),
      ),
    );
  }

  if (sourcePredicates.length === 0) {
    return [];
  }

  const linkedInvoices = await db
    .select({
      invoiceId: invoices.id,
    })
    .from(invoiceItems)
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      and(
        isNull(invoices.deletedAt),
        notInArray(invoices.status, ["void"]),
        or(...sourcePredicates),
      ),
    );

  const invoiceIds = Array.from(new Set(linkedInvoices.map((row) => row.invoiceId)));

  if (invoiceIds.length === 0) {
    return [];
  }

  return db
    .update(invoices)
    .set({ syncStatus: "needs_review" })
    .where(and(inArray(invoices.id, invoiceIds), isNull(invoices.deletedAt)))
    .returning();
}

export async function markInvoicesNeedsReviewByCustomerDate(input: {
  customerId: string;
  date: string;
}) {
  return db
    .update(invoices)
    .set({ syncStatus: "needs_review" })
    .where(
      and(
        eq(invoices.customerId, input.customerId),
        isNull(invoices.deletedAt),
        ne(invoices.status, "void"),
        lte(invoices.periodStart, input.date),
        gte(invoices.periodEnd, input.date),
      ),
    )
    .returning();
}
