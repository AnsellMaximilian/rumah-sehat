import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { CustomerSortBy, CustomerSortOrder } from "./customer.types";
import { customers } from "@/db/schema";
import { db } from "@/db/drizzle";

type CustomerMutationInput = {
  name: string;
  customerCode: string;
  address: string | null;
  notes: string | null;
};

function getCustomerOrderBy(
  sortBy: CustomerSortBy,
  sortOrder: CustomerSortOrder,
) {
  const columns = {
    createdAt: customers.createdAt,
    customerCode: customers.customerCode,
    name: customers.name,
    address: customers.address,
  } as const;

  const column = columns[sortBy];

  return sortOrder === "asc" ? asc(column) : desc(column);
}

function buildCustomerSearchFilter(query: string) {
  if (!query) {
    return undefined;
  }

  return or(
    ilike(customers.customerCode, `%${query}%`),
    ilike(customers.name, `%${query}%`),
    ilike(customers.address, `%${query}%`),
  );
}


export async function getPaginatedCustomers(
    input : {
        page: number,
        limit: number,
        query: string,
        sortBy: CustomerSortBy,
        sortOrder: CustomerSortOrder,

    }
){
    const {page, limit, query, sortBy, sortOrder} = input;

    const offset = (page - 1) * limit;

    const filter = buildCustomerSearchFilter(query)

    const baseQuery = filter 
        ? db.select().from(customers).where(filter) : db.select().from(customers)


    return baseQuery
        .orderBy(getCustomerOrderBy(sortBy, sortOrder))
        .limit(limit)
        .offset(offset)
}

export async function getCustomerCount(query: string) {

    const filter = buildCustomerSearchFilter(query);

    const baseQuery = filter ? db.select({count: count()}).from(customers).where(filter) :
    db.select({count: count()}).from(customers)
    const [{count: countResult}] =   await baseQuery;

    return countResult;
}

export async function getCustomer(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  return customer;
}


export async function getAllCustomers() {
  return db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
    })
    .from(customers)
    .orderBy(asc(customers.customerCode));
}

export async function searchCustomers(input: {
  query: string;
  limit: number;
}) {
  const filter = buildCustomerSearchFilter(input.query);
  const baseQuery = db
    .select({
      id: customers.id,
      customerCode: customers.customerCode,
      name: customers.name,
      
    })
    .from(customers);

  return (filter ? baseQuery.where(filter) : baseQuery)
    .orderBy(asc(customers.customerCode))
    .limit(input.limit);
}

export async function getCustomerByCode(customerCode: string, excludeId?: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      excludeId
        ? and(
            eq(customers.customerCode, customerCode),
            ne(customers.id, excludeId),
          )
        : eq(customers.customerCode, customerCode),
    );

  return customer;
}

export async function insertCustomer(input: CustomerMutationInput) {
  const [customer] = await db
    .insert(customers)
    .values({
      name: input.name,
      customerCode: input.customerCode,
      address: input.address,
      notes: input.notes,
      
    })
    .returning();

  return customer;
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerMutationInput>,
) {
  const updateData: Partial<CustomerMutationInput> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.customerCode !== undefined)
    updateData.customerCode = input.customerCode;
  if (input.address !== undefined)
    updateData.address = input.address;
  if (input.notes !== undefined)
    updateData.notes = input.notes;
  
  const [customer] = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.id, id))
    .returning();

  return customer;
}

export async function deleteCustomer(id: string) {
  const [customer] = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning();

  return customer;
}