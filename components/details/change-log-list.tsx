import { ChangeLog } from "@/modules/change-logs/change-log.types";

function formatValue(value: string | null) {
  if (value === null || value === "") {
    return "-";
  }

  if (value.length > 160) {
    return `${value.slice(0, 157)}...`;
  }

  return value;
}

export default function ChangeLogList({ logs }: { logs: ChangeLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No change logs yet.</p>;
  }

  return (
    <div className="divide-y rounded-lg border">
      {logs.map((log) => (
        <div key={log.id} className="space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">
              {log.action.replaceAll("_", " ")}
              {log.fieldName ? `: ${log.fieldName}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(log.changedAt))}
            </div>
          </div>
          {log.fieldName ? (
            <div className="grid gap-2 text-xs md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Old</div>
                <div className="break-words">{formatValue(log.oldValue)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">New</div>
                <div className="break-words">{formatValue(log.newValue)}</div>
              </div>
            </div>
          ) : (
            <div className="break-words text-xs text-muted-foreground">
              {formatValue(log.newValue ?? log.oldValue)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Changed by {log.changedByName ?? log.changedBy}
          </div>
        </div>
      ))}
    </div>
  );
}
