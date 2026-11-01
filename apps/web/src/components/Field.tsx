import type { InputHTMLAttributes, ReactNode } from "react";
import { controlClassName, controlErrorClassName } from "../lib/styles.ts";

type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className" | "aria-invalid" | "aria-describedby"
> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextField({ id, label, error, hint, className, ...inputProps }: TextFieldProps) {
  const message = error ?? hint;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`${controlClassName} ${error ? controlErrorClassName : ""}`}
      />
      {error ? <p id={messageId} className="mt-1.5 text-sm text-rose-700">{error}</p> : null}
      {!error && hint ? <p id={messageId} className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const message = error ?? hint;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? <p id={messageId} className="mt-1.5 text-sm text-rose-700">{error}</p> : null}
      {!error && hint ? <p id={messageId} className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
