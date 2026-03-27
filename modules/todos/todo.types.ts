export type Todo = {
  id: number;
  title: string;
  text: string | null;
  done: boolean;
}

export type CreateTodoInput = {
  text: string
}
