interface EditTodoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditTodoPageProps) {
  const { id } = await params;

  return <div>Edit Todo {id}</div>;
}

