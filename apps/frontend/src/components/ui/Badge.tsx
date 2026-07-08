import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "error" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
        variant === "default" && "bg-surface-elevated text-foreground",
        variant === "accent" && "bg-accent/15 text-accent",
        variant === "success" && "bg-success/12 text-success",
        variant === "error" && "bg-error/12 text-error",
        variant === "outline" && "border border-border text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
