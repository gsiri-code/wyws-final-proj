import * as React from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="block text-xs font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

