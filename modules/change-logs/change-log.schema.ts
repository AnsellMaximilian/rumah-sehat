import { z } from "zod";

export const ChangeLogSortBySchema = z.enum([
  "changedAt",
  "entityType",
  "action",
]);
