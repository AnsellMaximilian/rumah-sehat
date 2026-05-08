import { PaginatedResult } from "@/types";
import { Customer, CustomerListInput } from "./customer.types";
import { getAuthContext} from "@/modules/auth/auth.service"
import { buildPagination, normalizeListSort } from "@/lib/utils";
import { CustomerSortBySchema } from "./customer.schema";
import { deleteCustomer, getCustomer, getCustomerByCode, getCustomerCount, getPaginatedCustomers, insertCustomer, updateCustomer } from "./customer.repository";

type CustomerMutationInput = {
  name: string;
  customerCode: string;
  address: string | null;
  notes: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function normalizeCustomerInput(input: CustomerMutationInput) {
  return {
    name: input.name.trim(),
    customerCode: input.customerCode.trim(),
    address: normalizeOptionalText(input.address),
    notes: normalizeOptionalText(input.notes),

  };
}

async function ensureUniqueCustomerCode(customerCode: string) {
  const existingCustomer = await getCustomerByCode(customerCode);

  if (existingCustomer) {
    throw new Error("Customer code already exists");
  }
}

async function ensureUniqueCustomerCodeForUpdate(
  customerCode: string,
  customerId: string,
) {
  const duplicateCustomer = await getCustomerByCode(customerCode, customerId);

  if (duplicateCustomer) {
    throw new Error("Customer code already exists");
  }
}

export async function getCustomersService(
  input: CustomerListInput = {},
): Promise<PaginatedResult<Customer>> {
  const auth = await getAuthContext();

  await auth.require("view", "customers");

  const query = input.query?.trim() ?? "";
  const { sortBy, sortOrder } = normalizeListSort({
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    sortBySchema: CustomerSortBySchema,
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });
  const total = await getCustomerCount(query);
  const { page, limit, pagination } = buildPagination({
    page: input.page,
    limit: input.limit,
    total,
    maxLimit: 100,
    defaultPage: 1,
    defaultLimit: 10,
  });

  const data = await getPaginatedCustomers({
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
export async function getCustomerService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("view", "customers");

  return getCustomer(input.id);
}

export async function createCustomerService(input: CustomerMutationInput) {
  const auth = await getAuthContext();

  await auth.require("create", "customers");

  const normalizedInput = normalizeCustomerInput(input);

  await ensureUniqueCustomerCode(normalizedInput.customerCode);

  return insertCustomer(normalizedInput);
}

export async function updateCustomerService(
  input: CustomerMutationInput & { id: string },
) {
  const auth = await getAuthContext();

  await auth.require("update", "customers");

  const customer = await getCustomer(input.id);

  if (!customer) {
    throw new Error("Customer not found");
  }

  const normalizedInput = normalizeCustomerInput(input);

  await ensureUniqueCustomerCodeForUpdate(
    normalizedInput.customerCode,
    input.id,
  );

  return updateCustomer(input.id, normalizedInput);
}

export async function deleteCustomerService(input: { id: string }) {
  const auth = await getAuthContext();

  await auth.require("delete", "customers");

  const customer = await getCustomer(input.id);

  if (!customer) {
    throw new Error("Customer not found");
  }

  return deleteCustomer(input.id);
}