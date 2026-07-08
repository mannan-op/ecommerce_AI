import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-background shadow-soft hover:shadow-elevated hover:-translate-y-0.5 btn-shine",
        secondary:
          "border border-border bg-surface text-foreground hover:bg-surface-elevated hover:border-accent/40",
        ghost: "text-foreground hover:bg-surface-elevated",
        accent:
          "bg-accent text-primary shadow-soft hover:shadow-glow hover:-translate-y-0.5 btn-shine",
        danger: "bg-error text-white hover:opacity-90",
        outline:
          "border border-foreground/20 bg-transparent hover:border-accent hover:text-accent",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
