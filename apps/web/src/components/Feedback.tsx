import type { ReactNode } from "react";
import { Button } from "./Button.tsx";

export function Feedback({
  tone,
  message,
  onDismiss,
}: {
  tone: "success" | "error";
  message: string;
  onDismiss?: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${toneClass}`}
    >
      <p>{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 cursor-pointer font-medium underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 px-5 py-10 text-sm text-slate-600">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="px-5 py-8">
      <p className="text-sm font-medium text-rose-800">Could not load this data</p>
      <p className="mt-1 max-w-xl text-sm text-rose-700">{message}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
