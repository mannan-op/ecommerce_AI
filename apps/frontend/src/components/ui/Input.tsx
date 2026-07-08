import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-muted"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          {...props}
        />
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    );
  }
);
Input.displayName = "Input";
