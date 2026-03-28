import CreateForm from "../components/create-form";

export default async function Page() {
  return (
    <div className="">
      <h1 className="text-2xl font-bold">Add Todo</h1>
      <CreateForm />
    </div>
  );
}
