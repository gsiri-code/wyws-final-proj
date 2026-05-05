import * as React from "react";

export function Alert({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "error";
}) {
  const tones: Record<string, string> = {
    default: "border-slate-200 bg-slate-50 text-slate-900",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={`rounded-md border p-3 ${tones[tone] ?? tones.default}`}>
      {children}
    </div>
  );
}

export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold">{children}</div>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-sm opacity-90">{children}</div>;
}

