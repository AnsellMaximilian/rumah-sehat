import { ListInput, ListSortOrder } from "@/types";

export type Todo = {
  id: number;
  title: string;
  text: string | null;
  done: boolean;
};

export type TodoSortBy = "id" | "title";

export type TodoSortOrder = ListSortOrder;

export type TodoListInput = ListInput<TodoSortBy>;

export type CreateTodoInput = {
  text: string;
};
