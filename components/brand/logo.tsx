import * as React from "react";
import Link from "next/link";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" } = {}) {
  const textClass = variant === "light" ? "text-white" : "text-foreground";
  return (
    <Link href="/" className={`font-display text-lg tracking-tight ${textClass}`}>
      Sleepbook
    </Link>
  );
}

