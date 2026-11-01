import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "danger-ghost";
  size?: "sm" | "md";
};

const variants = {
  primary: "bg-teal-700 text-white shadow-sm hover:bg-teal-800 focus-visible:ring-teal-700",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400",
  danger: "bg-rose-700 text-white shadow-sm hover:bg-rose-800 focus-visible:ring-rose-700",
  ghost: "text-teal-700 hover:bg-teal-50 focus-visible:ring-teal-700",
  "danger-ghost": "text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-700",
} as const;

const sizes = {
  sm: "px-2.5 py-1.5",
  md: "px-3.5 py-2",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
