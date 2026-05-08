import { AlertCircleIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function FormActionAlert({
  title = "Unable to save changes",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}