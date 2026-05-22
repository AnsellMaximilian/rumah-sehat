import { PaginatedResult } from "@/types";
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { getAuthContext } from "@/modules/auth/auth.service";
import { logEntityCreated } from "@/modules/change-logs/change-log.service";
import { getCustomer } from "@/modules/customers/customer.repository";
import {
  getBillableDeliveryChargesForPreview,
  getDeliveredSalesLinesForPreview,
  getExistingInvoicedSourceIds,
  getInvoice,
  getInvoiceByNumber,
  getInvoiceCount,
  getInvoiceForCustomerPeriod,
  getInvoiceItems,
  getPaginatedInvoices,
  insertInvoice,
  insertInvoiceItem,
  markInvoicesNeedsReviewByCustomerDate,
  markInvoicesNeedsReviewBySources,
  replaceInvoiceItems,
  softDeleteInvoice,
  updateInvoice,
  voidInvoiceAndInsertReplacement,
} from "./invoice.repository";
import {
  Invoice,
  InvoiceDetail,
  InvoiceListInput,
  InvoicePreview,
  InvoicePreviewDeliveryCharge,
  InvoicePreviewSalesLine,
} from "./invoice.types";
import { InvoiceSortBySchema } from "./invoice.schema";

type InvoiceCreateInput = {
  customerId: string;
  periodStart: string;
  periodEnd: string;
  invoiceDate: string;
  invoiceNumber: string | null;
  notes: string | null;
};

type ManualInvoiceItemInput = {
  invoiceId: string;
  lineType: string;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
};

type InvoiceUpdateInput = {
  invoiceNumber: string | null;
  invoiceDate: string;
  status: string;
  syncStatus: string;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeInvoiceCreateInput(input: InvoiceCreateInput) {
  return {
    customerId: input.customerId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    invoiceDate: input.invoiceDate,
    invoiceNumber: normalizeOptionalText(input.invoiceNumber),
    notes: normalizeOptionalText(input.notes),
  };
}


function normalizeManualInvoiceItemInput(input: ManualInvoiceItemInput) {
  return {
    invoiceId: input.invoiceId,
    lineType: input.lineType,
    description: input.description.trim(),
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    amount: input.amount,
  };
}

function normalizeInvoiceUpdateInput(input: InvoiceUpdateInput) {
  return {
    invoiceNumber: normalizeOptionalText(input.invoiceNumber),
    invoiceDate: input.invoiceDate,
    status: input.status,
    syncStatus: input.syncStatus,
    notes: normalizeOptionalText(input.notes),
  };
}

function buildReplacementInvoiceNotes(input: {
  originalInvoiceId: string;
  originalInvoiceNumber: string | null;
  originalNotes: string | null;
}) {
  const reference = input.originalInvoiceNumber || input.originalInvoiceId;
  const prefix = `Reissued from invoice ${reference}.`;

  if (!input.originalNotes) {
    return prefix;
  }

  return `${prefix}\n\nPrevious notes:\n${input.originalNotes}`;
}

function getDateRangeBounds(periodStart: string, periodEnd: string) {
  return {
    start: new Date(`${periodStart}T00:00:00`),
    end: new Date(`${periodEnd}T23:59:59.999`),
  };
}

function getEffectiveEventDate(input: {
  deliveryDeliveredAt: Date | null;
  deliveryRecordedAt: Date | null;
  supplierPurchaseDate?: string | null;
  fallbackDate?: Date | null;
}) {
  if (input.deliveryDeliveredAt) {
    return input.deliveryDeliveredAt;
  }

  if (input.deliveryRecordedAt) {
    return input.deliveryRecordedAt;
  }

  if (input.supplierPurchaseDate) {
    return new Date(`${input.supplierPurchaseDate}T00:00:00`);
  }

  return input.fallbackDate ?? null;
}

function isDateWithinRange(
  value: Date | null,
  bounds: ReturnType<typeof getDateRangeBounds>,
) {
  if (!value) {
    return false;
  }

  const timestamp = value.getTime();

  return timestamp >= bounds.start.getTime() && timestamp <= bounds.end.getTime();
}

function computeSalesLineAmount(quantity: number, unitSellPrice: number) {
  const amount = quantity * unitSellPrice;

  if (!Number.isInteger(amount)) {
    throw new Error("Sales line total must resolve to a whole rupiah amount before invoicing");
  }

  return amount;
}

async function ensureCustomerExists(customerId: string) {
  const customer = await getCustomer(customerId);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

async function ensureUniqueInvoiceNumber(invoiceNumber: string | null, excludeId?: string) {
  if (!invoiceNumber) {
    return;
  }

  const existingInvoice = await getInvoiceByNumber(invoiceNumber, excludeId);

  if (existingInvoice) {
    throw new Error("Invoice number already exists");
  }
}

async function ensureUniqueCustomerPeriod(input: {
  customerId: string;
  periodStart: string;
  periodEnd: string;
  excludeId?: string;
}) {
  const existingInvoice = await getInvoiceForCustomerPeriod(input);

  if (existingInvoice) {
    throw new Error("An invoice already exists for this customer and period");
  }
}

async function buildInvoicePreview(input: {
  customerId: string;
  excludeInvoiceId?: string;
  periodStart: string;
  periodEnd: string;
}): Promise<InvoicePreview> {
  const customer = await ensureCustomerExists(input.customerId);
  const bounds = getDateRangeBounds(input.periodStart, input.periodEnd);

  const [salesLineRows, deliveryChargeRows, invoicedSalesLineIds, invoicedChargeIds] =
    await Promise.all([
      getDeliveredSalesLinesForPreview(input.customerId),
      getBillableDeliveryChargesForPreview(input.customerId),
      Promise.resolve([] as string[]),
      Promise.resolve([] as string[]),
    ]);

  const salesLineCandidates = salesLineRows.filter((row) =>
    isDateWithinRange(
      getEffectiveEventDate({
        deliveryDeliveredAt: row.deliveryDeliveredAt,
        deliveryRecordedAt: row.deliveryRecordedAt,
        supplierPurchaseDate: row.supplierPurchaseDate,
        fallbackDate: row.updatedAt,
      }),
      bounds,
    ),
  );

  const deliveryChargeCandidates = deliveryChargeRows.filter((row) =>
    isDateWithinRange(
      getEffectiveEventDate({
        deliveryDeliveredAt: row.deliveryDeliveredAt,
        deliveryRecordedAt: row.deliveryRecordedAt,
      }),
      bounds,
    ),
  );

  const actualInvoicedSalesLineIds = salesLineCandidates.length
    ? await getExistingInvoicedSourceIds({
        excludeInvoiceId: input.excludeInvoiceId,
        sourceType: "sales_line",
        sourceIds: salesLineCandidates.map((row) => row.id),
      })
    : invoicedSalesLineIds;
  const actualInvoicedChargeIds = deliveryChargeCandidates.length
    ? await getExistingInvoicedSourceIds({
        excludeInvoiceId: input.excludeInvoiceId,
        sourceType: "delivery_charge",
        sourceIds: deliveryChargeCandidates.map((row) => row.id),
      })
    : invoicedChargeIds;

  const uninvoicedSalesLines = salesLineCandidates.filter(
    (row) => !actualInvoicedSalesLineIds.includes(row.id),
  );
  const uninvoicedDeliveryCharges = deliveryChargeCandidates.filter(
    (row) => !actualInvoicedChargeIds.includes(row.id),
  );

  const previewSalesLines: InvoicePreviewSalesLine[] = [];
  const blockedSalesLines: InvoicePreviewSalesLine[] = [];

  for (const row of uninvoicedSalesLines) {
    if (row.unitSellPrice === null) {
      blockedSalesLines.push({
        id: row.id,
        customerId: row.customerId,
        customerCode: row.customerCode,
        customerName: row.customerName,
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        quantity: row.quantity,
        unitSellPrice: row.unitSellPrice,
        status: row.status,
        deliveryRecordedAt: row.deliveryRecordedAt,
        deliveryDeliveredAt: row.deliveryDeliveredAt,
        amount: null,
      });
      continue;
    }

    previewSalesLines.push({
      id: row.id,
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      quantity: row.quantity,
      unitSellPrice: row.unitSellPrice,
      status: row.status,
      deliveryRecordedAt: row.deliveryRecordedAt,
      deliveryDeliveredAt: row.deliveryDeliveredAt,
      amount: computeSalesLineAmount(row.quantity, row.unitSellPrice),
    });
  }

  const previewDeliveryCharges: InvoicePreviewDeliveryCharge[] =
    uninvoicedDeliveryCharges.map((row) => ({
      id: row.id,
      deliveryId: row.deliveryId,
      customerId: row.customerId,
      customerCode: row.customerCode,
      customerName: row.customerName,
      chargeType: row.chargeType,
      description: row.description,
      amount: row.amount,
      deliveryRecordedAt: row.deliveryRecordedAt,
      deliveryDeliveredAt: row.deliveryDeliveredAt,
    }));

  const salesLinesTotal = previewSalesLines.reduce(
    (sum, salesLine) => sum + (salesLine.amount ?? 0),
    0,
  );
  const deliveryChargesTotal = previewDeliveryCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0,
  );

  return {
    customerId: customer.id,
    customerCode: customer.customerCode,
    customerName: customer.name,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    salesLines: previewSalesLines,
    blockedSalesLines,
    deliveryCharges: previewDeliveryCharges,
    salesLinesTotal,
    deliveryChargesTotal,
    grandTotal: salesLinesTotal + deliveryChargesTotal,
    canGenerate:
      blockedSalesLines.length === 0 &&
      (previewSalesLines.length > 0 || previewDeliveryCharges.length > 0),
  };
}

export async function getInvoicesService(
  input: InvoiceListInput = {},
): Promise<PaginatedResult<Invoice>> {
  const auth = await getAuthContext();

  await auth.require("view", "invoices");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: InvoiceSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getInvoiceCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedInvoices({
    page,
    limit,
    query,
    sortBy,
    sortOrder,
  });

  return {
    data,
    pagination,
  };
}

export async function getInvoiceService(input: { id: string }): Promise<InvoiceDetail | null> {
  const auth = await getAuthContext();

  await auth.require("view", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    return null;
  }

  const items = await getInvoiceItems(input.id);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    ...invoice,
    items,
    totalAmount,
  };
}

export async function getInvoicePreviewService(input: {
  customerId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const auth = await getAuthContext();

  await auth.require("create", "invoices");

  return buildInvoicePreview(input);
}

export async function getDraftInvoicePreviewService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return buildInvoicePreview({
    customerId: invoice.customerId,
    excludeInvoiceId: invoice.id,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
  });
}

export async function createInvoiceService(input: InvoiceCreateInput) {
  const auth = await getAuthContext();

  await auth.require("create", "invoices");

  const normalizedInput = normalizeInvoiceCreateInput(input);

  await ensureCustomerExists(normalizedInput.customerId);
  await ensureUniqueInvoiceNumber(normalizedInput.invoiceNumber);
  await ensureUniqueCustomerPeriod({
    customerId: normalizedInput.customerId,
    periodStart: normalizedInput.periodStart,
    periodEnd: normalizedInput.periodEnd,
  });

  const preview = await buildInvoicePreview({
    customerId: normalizedInput.customerId,
    periodStart: normalizedInput.periodStart,
    periodEnd: normalizedInput.periodEnd,
  });

  if (!preview.canGenerate) {
    if (preview.blockedSalesLines.length > 0) {
      throw new Error("Some delivered sales lines are missing sell prices");
    }

    throw new Error("No uninvoiced items or charges found for this period");
  }

  return insertInvoice({
    invoice: {
      customerId: normalizedInput.customerId,
      invoiceNumber: normalizedInput.invoiceNumber,
      periodStart: normalizedInput.periodStart,
      periodEnd: normalizedInput.periodEnd,
      invoiceDate: normalizedInput.invoiceDate,
      status: "draft",
      syncStatus: "current",
      notes: normalizedInput.notes,
      createdBy: auth.user.id,
    },
    items: [
      ...preview.salesLines.map((salesLine) => ({
        lineType: "product",
        description: salesLine.productName ?? "Product",
        productId: salesLine.productId,
        quantity: salesLine.quantity,
        unitPrice: salesLine.unitSellPrice,
        amount: salesLine.amount ?? 0,
        sourceType: "sales_line",
        sourceId: salesLine.id,
      })),
      ...preview.deliveryCharges.map((charge) => ({
        lineType: "delivery_charge",
        description: charge.description,
        productId: null,
        quantity: null,
        unitPrice: null,
        amount: charge.amount,
        sourceType: "delivery_charge",
        sourceId: charge.id,
      })),
    ],
  });
}


export async function createManualInvoiceItemService(input: ManualInvoiceItemInput) {
  const auth = await getAuthContext();

  await auth.require("update", "invoices");

  const normalizedInput = normalizeManualInvoiceItemInput(input);
  const invoice = await getInvoice(normalizedInput.invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "void") {
    throw new Error("Void invoices cannot receive manual items");
  }

  const invoiceItem = await insertInvoiceItem({
    invoiceId: normalizedInput.invoiceId,
    lineType: normalizedInput.lineType,
    description: normalizedInput.description,
    productId: null,
    quantity: normalizedInput.quantity,
    unitPrice: normalizedInput.unitPrice,
    amount: normalizedInput.amount,
    sourceType: "manual",
    sourceId: null,
  });

  await logEntityCreated({
    changedBy: auth.user.id,
    entity: invoiceItem,
    entityId: invoiceItem.id,
    entityType: "invoice_item",
    reason: `Manual item added to invoice ${invoice.invoiceNumber || invoice.id}`,
  });

  return invoiceItem;
}

export async function updateInvoiceService(input: InvoiceUpdateInput & { id: string }) {
  const auth = await getAuthContext();

  await auth.require("update", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const normalizedInput = normalizeInvoiceUpdateInput(input);

  await ensureUniqueInvoiceNumber(normalizedInput.invoiceNumber, input.id);

  return updateInvoice(input.id, normalizedInput);
}

export async function regenerateDraftInvoiceService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("update", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be regenerated");
  }

  const preview = await buildInvoicePreview({
    customerId: invoice.customerId,
    excludeInvoiceId: invoice.id,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
  });

  if (preview.blockedSalesLines.length > 0) {
    throw new Error("Some delivered sales lines are missing sell prices");
  }

  if (preview.salesLines.length === 0 && preview.deliveryCharges.length === 0) {
    throw new Error("No uninvoiced items or charges remain for this draft invoice");
  }

  return replaceInvoiceItems(input.id, [
    ...preview.salesLines.map((salesLine) => ({
      lineType: "product",
      description: salesLine.productName ?? "Product",
      productId: salesLine.productId,
      quantity: salesLine.quantity,
      unitPrice: salesLine.unitSellPrice,
      amount: salesLine.amount ?? 0,
      sourceType: "sales_line",
      sourceId: salesLine.id,
    })),
    ...preview.deliveryCharges.map((charge) => ({
      lineType: "delivery_charge",
      description: charge.description,
      productId: null,
      quantity: null,
      unitPrice: null,
      amount: charge.amount,
      sourceType: "delivery_charge",
      sourceId: charge.id,
    })),
  ]);
}

export async function voidAndReissueInvoiceService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("update", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status !== "issued" && invoice.status !== "paid") {
    throw new Error("Only issued or paid invoices can be voided and reissued");
  }

  const preview = await buildInvoicePreview({
    customerId: invoice.customerId,
    excludeInvoiceId: invoice.id,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
  });

  if (preview.blockedSalesLines.length > 0) {
    throw new Error("Some delivered sales lines are missing sell prices");
  }

  if (preview.salesLines.length === 0 && preview.deliveryCharges.length === 0) {
    throw new Error("No uninvoiced items or charges remain to reissue");
  }

  return voidInvoiceAndInsertReplacement({
    invoiceId: invoice.id,
    replacementInvoice: {
      customerId: invoice.customerId,
      invoiceNumber: null,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      invoiceDate: invoice.invoiceDate,
      status: "draft",
      syncStatus: "current",
      notes: buildReplacementInvoiceNotes({
        originalInvoiceId: invoice.id,
        originalInvoiceNumber: invoice.invoiceNumber,
        originalNotes: invoice.notes,
      }),
      createdBy: auth.user.id,
    },
    replacementItems: [
      ...preview.salesLines.map((salesLine) => ({
        lineType: "product",
        description: salesLine.productName ?? "Product",
        productId: salesLine.productId,
        quantity: salesLine.quantity,
        unitPrice: salesLine.unitSellPrice,
        amount: salesLine.amount ?? 0,
        sourceType: "sales_line",
        sourceId: salesLine.id,
      })),
      ...preview.deliveryCharges.map((charge) => ({
        lineType: "delivery_charge",
        description: charge.description,
        productId: null,
        quantity: null,
        unitPrice: null,
        amount: charge.amount,
        sourceType: "delivery_charge",
        sourceId: charge.id,
      })),
    ],
  });
}

export async function deleteInvoiceService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "invoices");

  const invoice = await getInvoice(input.id);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be deleted");
  }

  return softDeleteInvoice(input.id);
}

export { markInvoicesNeedsReviewBySources };

export async function markInvoicesNeedsReviewForCustomerDate(input: {
  customerId: string;
  eventDate: Date | null;
}) {
  if (!input.eventDate) {
    return [];
  }

  const date = input.eventDate.toISOString().slice(0, 10);

  return markInvoicesNeedsReviewByCustomerDate({
    customerId: input.customerId,
    date,
  });
}
