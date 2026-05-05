import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...props }, ref) {
    // Some existing components pass `invalid` as a convenience prop. Map it
    // to `aria-invalid` and omit it from the DOM.
    const { invalid, ...rest } = props;
    return (
      <input
        ref={ref}
        className={[
          "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none",
          "focus:border-slate-900",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={invalid ? "true" : undefined}
        {...rest}
      />
    );
  }
);

