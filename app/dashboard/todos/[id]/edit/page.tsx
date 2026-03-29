import PageSection from "@/components/layout/page-section";
import { getTodoService } from "@/modules/todos/todo.service";
import { notFound } from "next/navigation";
import EditForm from "./components/edit-form";

interface EditTodoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditTodoPageProps) {
  const { id } = await params;
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
      title={`Edit Todo #${id}`}
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Todos", href: "/dashboard/todos" },
        { label: `Edit Todo #${id}` },
      ]}
    >
      <EditForm todo={todo} />
    </PageSection>
  );
}
