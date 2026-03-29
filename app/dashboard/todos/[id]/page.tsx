import PageSection from "@/components/layout/page-section";
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

  return (
    <PageSection
      title={`Todo #${todo.id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Todos", href: "/dashboard/todos" },
        { label: `Todo #${todo.id}` },
      ]}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold">{todo.title}</h2>
        <p className="text-muted-foreground">{todo.text}</p>
      </div>
    </PageSection>
  );
}
