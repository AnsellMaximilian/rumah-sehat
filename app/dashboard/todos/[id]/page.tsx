import { getTodoService } from "@/modules/todos/todo.service";
import { notFound } from "next/navigation";

export default async function Page(props: PageProps<"/dashboard/todos/[id]">) {
  const { id } = await props.params;

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound();
  }

  const todo = await getTodoService({ id: parsedId });

  if (!todo) {
    notFound();
  }

  return <div>{todo.title}</div>;
}
