import { CheckCircle2, Circle, XCircle, AlertCircle, Clock } from "lucide-react";

type StepStatus = "completed" | "active" | "pending" | "failed" | "disputed";

interface TimelineStep {
  label: string;
  status: StepStatus;
  date?: string;
  note?: string;
}

interface TransactionTimelineProps {
  steps: TimelineStep[];
}

const icons: Record<StepStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  active: <Clock className="w-5 h-5 text-amber-500" />,
  pending: <Circle className="w-5 h-5 text-gray-300" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
  disputed: <AlertCircle className="w-5 h-5 text-red-500" />,
};

const lineColors: Record<StepStatus, string> = {
  completed: "bg-emerald-400",
  active: "bg-amber-400",
  pending: "bg-gray-200",
  failed: "bg-red-300",
  disputed: "bg-red-300",
};

export function TransactionTimeline({ steps }: TransactionTimelineProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="mt-0.5">{icons[step.status]}</div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 mt-1 mb-1 rounded-full ${lineColors[steps[i + 1].status === "completed" ? "completed" : step.status]}`} style={{ minHeight: 24 }} />
            )}
          </div>
          <div className={`pb-5 ${i === steps.length - 1 ? "" : ""}`}>
            <p className={`text-sm font-medium ${step.status === "pending" ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}`}>{step.label}</p>
            {step.date && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{step.date}</p>}
            {step.note && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 italic">{step.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
