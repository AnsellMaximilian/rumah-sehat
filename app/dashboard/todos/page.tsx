import { getTodosService } from "@/modules/todos/todo.service";
import { TodoSortBySchema } from "@/modules/todos/todo.schemas";
import { columns } from "./components/columns";
import { DataTable } from "@/components/ui/data-table/data-table";
import PageSection from "@/components/layout/page-section";
import { ListSearchParams, SearchParamValue } from "@/types";
import { parseListSearchParams } from "@/lib/utils";

type TodoFilters = {
  completed?: SearchParamValue;
};
type TodoSearchParams = ListSearchParams<TodoFilters>;

export default async function Page(props: {
  searchParams?: Promise<TodoSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const listInput = parseListSearchParams(searchParams, {
    sortBySchema: TodoSortBySchema,
    defaultSortBy: "id",
    defaultSortOrder: "desc",
    defaultPage: 1,
    defaultLimit: 10,
  });
  const todos = await getTodosService(listInput);

  return (
    <PageSection
      title="Todos"
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Todos" },
      ]}
    >
      <DataTable
        columns={columns}
        data={todos.data}
        pagination={todos.pagination}
        query={listInput.query}
        sortBy={listInput.sortBy}
        sortOrder={listInput.sortOrder}
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
    </PageSection>
  );
}
