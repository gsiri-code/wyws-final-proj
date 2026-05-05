import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export function Button({
  asChild,
  variant = "primary",
  size = "md",
  width,
  isLoading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: Variant;
  size?: Size;
  width?: "full";
  isLoading?: boolean;
}) {
  const Comp: any = asChild ? "span" : "button";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<Variant, string> = {
    primary: "bg-black text-white hover:bg-black/90",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
  };
  const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };
  return (
    <Comp
      className={[
        base,
        variants[variant],
        sizes[size],
        width === "full" ? "w-full" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={props.disabled || isLoading}
      {...props}
    />
  );
}

