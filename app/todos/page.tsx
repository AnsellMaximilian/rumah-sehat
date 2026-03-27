import { getTodosService } from "@/modules/todos/todo.service";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default async function Page(
  props: {
    searchParams?: {
      page?: string;
      limit?: string;
      query?: string;
    }
  }
) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const todos = await getTodosService({
    page: currentPage,
    limit: 10,
  })

  return (
    <main className="p-4">
      <h1>Todos</h1>
      <DataTable columns={columns} data={todos.data} />
    </main>
  )
}
