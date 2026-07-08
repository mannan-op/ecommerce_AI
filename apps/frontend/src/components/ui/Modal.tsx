"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl" | "studio";
  noPadding?: boolean;
  scrollable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "lg",
  noPadding = false,
  scrollable = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            className={cn(
              "relative z-10 flex w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-surface shadow-elevated sm:max-h-[90vh] sm:rounded-3xl",
              "max-h-[92dvh]",
              size === "md" && "max-w-md",
              size === "lg" && "max-w-2xl",
              size === "xl" && "max-w-4xl",
              size === "studio" && "max-w-6xl",
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 id="modal-title" className="font-display text-xl">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : null}
            <div
              className={cn(
                "min-h-0 flex-1",
                scrollable ? "overflow-y-auto" : "flex flex-col overflow-hidden",
                !noPadding && "p-6"
              )}
            >
              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
