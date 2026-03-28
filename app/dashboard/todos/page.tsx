import { getTodosService } from "@/modules/todos/todo.service";
import {
  TodoSortBySchema,
  TodoSortOrderSchema,
} from "@/modules/todos/todo.schemas";
import { columns } from "./components/columns";
import { DataTable } from "@/components/ui/data-table/data-table";
import { normalizePositiveInt } from "@/lib/utils";

type TodoPageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  query?: string | string[];
  sortBy?: string | string[];
  sortOrder?: string | string[];
}>;

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page(props: {
  searchParams?: TodoPageSearchParams;
}) {
  const searchParams = await props.searchParams;
  const query = getSingleSearchParam(searchParams?.query)?.trim() ?? "";
  const currentPage = normalizePositiveInt(
    getSingleSearchParam(searchParams?.page),
    1,
  );
  const limit = normalizePositiveInt(
    getSingleSearchParam(searchParams?.limit),
    10,
  );
  const parsedSortBy = TodoSortBySchema.safeParse(
    getSingleSearchParam(searchParams?.sortBy),
  );
  const parsedSortOrder = TodoSortOrderSchema.safeParse(
    getSingleSearchParam(searchParams?.sortOrder),
  );
  const sortBy = parsedSortBy.success ? parsedSortBy.data : "id";
  const sortOrder = parsedSortOrder.success ? parsedSortOrder.data : "desc";

  const todos = await getTodosService({
    page: currentPage,
    limit,
    query,
    sortBy,
    sortOrder,
  });

  return (
    <main className="p-4">
      <h1>Todos</h1>
      <DataTable
        columns={columns}
        data={todos.data}
        pagination={todos.pagination}
        query={query}
        sortBy={sortBy}
        sortOrder={sortOrder}
        search={{
          placeholder: "Search titles...",
        }}
        sorting={{
          defaultSortBy: "id",
        }}
        labels={{
          resourceName: {
            singular: "todo",
            plural: "todos",
          },
          updatingMessage: "Updating todos...",
        }}
      />
    </main>
  );
}
