import { getTodoService } from "@/modules/todos/todo.service";
import { notFound } from "next/navigation";

export default async function Page(props: PageProps<"/todos/[id]">) {
  const { id } = await props.params;
  const todo = await getTodoService({ id: Number(id) });

  if (!todo) {
    notFound();
  }

  return <div>{todo.title}</div>;
}
