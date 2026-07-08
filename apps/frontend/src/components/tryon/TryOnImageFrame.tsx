"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageOff, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface TryOnImageFrameProps {
  src: string;
  alt: string;
  label: string;
  sublabel?: string;
  badge?: string;
  className?: string;
  priority?: boolean;
  onChangePhoto?: () => void;
}

export function TryOnImageFrame({
  src,
  alt,
  label,
  sublabel,
  badge,
  className,
  priority = false,
  onChangePhoto,
}: TryOnImageFrameProps) {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <>
      <figure
        className={cn(
          "flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-surface-elevated/60 shadow-soft",
          className
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {label}
            </p>
            {sublabel ? (
              <p className="mt-0.5 truncate font-display text-sm text-foreground">
                {sublabel}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onChangePhoto ? (
              <button
                type="button"
                onClick={onChangePhoto}
                className="rounded-full border border-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Change photo
              </button>
            ) : null}
            {badge ? (
              <span className="rounded-full bg-accent/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">
                {badge}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="tryon-image-canvas relative w-full overflow-auto p-3 sm:p-4"
          style={{ maxHeight: "min(42vh, 420px)", minHeight: "200px" }}
        >
          {failed ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-muted">
              <ImageOff className="h-8 w-8" />
              <p className="text-sm">Could not display this image</p>
              {onChangePhoto ? (
                <button
                  type="button"
                  onClick={onChangePhoto}
                  className="text-sm text-accent underline-offset-4 hover:underline"
                >
                  Upload a different file
                </button>
              ) : null}
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={src}
              src={src}
              alt={alt}
              decoding="async"
              loading={priority ? "eager" : "lazy"}
              onError={() => setFailed(true)}
              onLoad={() => setFailed(false)}
              className="mx-auto block w-full object-contain"
              style={{ maxHeight: "min(40vh, 400px)" }}
            />
          )}
          {!failed ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="absolute right-6 top-6 rounded-full border border-border/60 bg-surface/95 p-2.5 text-muted shadow-soft backdrop-blur-md transition-colors hover:text-foreground"
              aria-label={`View full ${label}`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </figure>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              className="relative max-h-[92vh] max-w-[min(96vw,900px)]"
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                className="block max-h-[92vh] w-auto max-w-full rounded-2xl object-contain shadow-elevated"
              />
              <p className="mt-3 text-center font-display text-sm text-white/90">
                {label}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
