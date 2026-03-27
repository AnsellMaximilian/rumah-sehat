import { z } from "zod"

const TodoSchema = z.object({
  id: z.number().positive(),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  text: z.string().max(200, "Text must be less than 200 characters").optional(),
  done: z.boolean(),
})



export const CreateTodoSchema = TodoSchema.omit({ id: true, done: true });
export const UpdateTodoSchema = TodoSchema.partial().omit({ id: true });
export const TodoSortBySchema = z.enum(["id", "title"]);
export const TodoSortOrderSchema = z.enum(["asc", "desc"]);
