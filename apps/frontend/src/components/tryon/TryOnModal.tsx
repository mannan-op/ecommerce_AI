"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Loader2,
  MessageCircle,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import { VariantSelector } from "@/components/product/VariantSelector";
import { TryOnImageFrame } from "@/components/tryon/TryOnImageFrame";
import { TryOnStylistChat } from "@/components/tryon/TryOnStylistChat";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import type { ProductDetail, ProductVariant } from "@/lib/api/types";
import {
  createTryOnJob,
  fetchTryOnConfig,
  pollTryOnJob,
  type TryOnConfig,
  type TryOnJob,
} from "@/lib/api/tryon";
import { normalizeMediaUrl } from "@/lib/media";
import { useCartStore } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

type Step = "upload" | "processing" | "result" | "chat";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "processing", label: "Atelier" },
  { id: "result", label: "Reveal" },
];

interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductDetail;
}

export function TryOnModal({ open, onClose, product }: TryOnModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCartStore((s) => s.addItem);

  const [step, setStep] = useState<Step>("upload");
  const [selected, setSelected] = useState<ProductVariant | null>(
    product.variants.find((v) => v.is_active) ?? null
  );
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [job, setJob] = useState<TryOnJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tryOnConfig, setTryOnConfig] = useState<TryOnConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const garmentImage = normalizeMediaUrl(product.primary_image);
  const resultUrl = normalizeMediaUrl(job?.result_image);
  const uploadedUrl =
    preview ?? normalizeMediaUrl(job?.user_photo) ?? null;

  useEffect(() => {
    if (!open) return;
    fetchTryOnConfig()
      .then(setTryOnConfig)
      .catch(() => setTryOnConfig(null));
  }, [open]);

  const reset = useCallback(() => {
    setStep("upload");
    setConsent(false);
    setPhoto(null);
    setPreview(null);
    setJob(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    }
  }, [open, reset, preview]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(file: File | null) {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPhoto(file);
    setError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.onerror = () => {
      setError("Could not read that image. Try JPG or PNG.");
      setPreview(null);
      setPhoto(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleStartTryOn() {
    if (!user) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }
    if (!photo || !consent) return;

    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      const formData = new FormData();
      formData.append("product", product.id);
      if (selected) formData.append("variant_id", selected.id);
      formData.append("user_photo", photo);
      formData.append("consent_given", "true");

      const created = await createTryOnJob(formData);
      const finished =
        created.status === "completed" || created.status === "failed"
          ? created
          : await pollTryOnJob(created.id);

      setJob(finished);
      if (finished.status === "failed") {
        setError(finished.error_message || "Try-on could not be completed.");
      }
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToBag() {
    if (!selected || !job) return;
    await addItem(
      selected,
      { name: product.name, image: garmentImage },
      1
    );
    onClose();
    router.push("/cart");
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Modal open={open} onClose={onClose} size="studio" noPadding scrollable={false}>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Hero header */}
        <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-accent/8 via-surface to-surface px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent">
                MAISON Atelier
              </p>
              <h2 className="heading-display mt-1 text-2xl sm:text-3xl">
                Virtual try-on
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted">
                See the full picture — your photo and your styled look, side by side.
              </p>
            </div>
            {garmentImage ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/80 px-3 py-2 backdrop-blur-sm">
                <div className="relative h-14 w-11 overflow-hidden rounded-lg bg-surface-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garmentImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm">{product.name}</p>
                  <p className="text-xs text-muted">
                    {selected?.color ?? "Select variant"}
                  </p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border/60 p-2.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step rail */}
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const active = i === stepIndex;
              const done = i < stepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      done && "bg-accent text-primary",
                      active && !done && "border-2 border-accent text-accent",
                      !active && !done && "border border-border text-muted"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs uppercase tracking-wider sm:inline",
                      active ? "text-foreground" : "text-muted"
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <div className="mx-1 h-px w-6 bg-border sm:w-10" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {tryOnConfig ? (
            <p
              className={cn(
                "mb-5 text-xs uppercase tracking-wider",
                tryOnConfig.is_demo ? "text-muted" : "text-accent"
              )}
            >
              {tryOnConfig.message}
              {tryOnConfig.is_free ? " · Complimentary" : ""}
            </p>
          ) : null}

          {step === "upload" ? (
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
              <div className="order-2 space-y-5 lg:order-1">
                <div>
                  <h3 className="font-display text-xl">Your fitting room</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Upload a clear, front-facing photo. We show your complete image —
                    never cropped — alongside the AI-rendered look.
                  </p>
                </div>
                <VariantSelector variants={product.variants} onSelect={setSelected} />
                <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-elevated/40 p-4 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border accent-accent"
                  />
                  <span>
                    I consent to MAISON processing my photo for this session. Images
                    are deleted after 30 days.
                  </span>
                </label>
                {error ? (
                  <p className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="order-1 lg:order-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
                {preview ? (
                  <TryOnImageFrame
                    src={preview}
                    alt="Your uploaded photo"
                    label="Your photo"
                    sublabel="Full image preview"
                    badge="Original"
                    priority
                    onChangePhoto={openFilePicker}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="flex min-h-[240px] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-accent/30 bg-gradient-to-b from-accent/5 to-transparent transition-all hover:border-accent hover:shadow-glow sm:min-h-[280px]"
                  >
                    <div className="rounded-full bg-accent/15 p-5">
                      <Upload className="h-8 w-8 text-accent" />
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg">Upload your photo</p>
                      <p className="mt-1 text-sm text-muted">
                        JPG or PNG · max 8 MB · full body or upper torso
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {step === "processing" ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {uploadedUrl ? (
                <TryOnImageFrame
                  src={uploadedUrl}
                  alt="Your photo being styled"
                  label="Your photo"
                  sublabel="Source image"
                  badge="Processing"
                />
              ) : null}
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-surface-elevated/40 px-8 py-16 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-6 rounded-full border border-accent/30 p-5"
                >
                  <Sparkles className="h-10 w-10 text-accent" />
                </motion.div>
                <p className="font-display text-2xl">The atelier is at work</p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  Fitting <span className="text-foreground">{product.name}</span> to
                  your silhouette. This takes about{" "}
                  {tryOnConfig?.estimated_seconds ?? 90} seconds.
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Generating your look…
                </div>
              </div>
            </div>
          ) : null}

          {step === "result" && job ? (
            <div className="space-y-8">
              {job.status === "completed" && resultUrl && uploadedUrl ? (
                <>
                  <div className="text-center lg:text-left">
                    <h3 className="font-display text-2xl">Your reveal</h3>
                    <p className="mt-2 text-sm text-muted">
                      Compare your original upload with the complete generated look.
                      Tap expand on any image for full-screen view.
                    </p>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <TryOnImageFrame
                      src={uploadedUrl}
                      alt="Your original uploaded photo"
                      label="Your photo"
                      sublabel="As you uploaded"
                      badge="Before"
                      priority
                    />
                    <TryOnImageFrame
                      src={resultUrl}
                      alt={`Try-on result for ${product.name}`}
                      label="Your MAISON look"
                      sublabel={product.name}
                      badge="After"
                      priority
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/60 pt-6 lg:justify-start">
                    <Button variant="accent" size="lg" onClick={handleAddToBag} disabled={!selected}>
                      Add to bag
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => setStep("chat")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask AI stylist
                    </Button>
                    <a
                      href={resultUrl}
                      download={`maison-tryon-${product.slug}.jpg`}
                      className="inline-flex h-13 items-center justify-center rounded-2xl border border-border px-6 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                    >
                      Download look
                    </a>
                    <Button variant="ghost" onClick={() => setStep("upload")}>
                      Try another photo
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 text-center">
                  <p className="rounded-2xl border border-error/30 bg-error/5 px-4 py-4 text-sm text-error">
                    {error || job.error_message || "Try-on failed. Please try another photo."}
                  </p>
                  {uploadedUrl ? (
                    <div className="mx-auto max-w-md">
                      <TryOnImageFrame
                        src={uploadedUrl}
                        alt="Your uploaded photo"
                        label="Your photo"
                        sublabel="Upload retained"
                      />
                    </div>
                  ) : null}
                  <Button variant="secondary" onClick={() => setStep("upload")}>
                    Upload a new photo
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {step === "chat" && job ? (
            <TryOnStylistChat
              jobId={job.id}
              productName={product.name}
              variantLabel={selected?.color ?? job.variant_color}
              enabled={tryOnConfig?.stylist_chat_enabled ?? false}
              onBack={() => setStep("result")}
            />
          ) : null}
        </div>

        {step === "upload" ? (
          <div className="shrink-0 border-t border-border/60 bg-surface px-5 py-4 sm:px-8">
            {!user ? (
              <Button
                variant="accent"
                fullWidth
                size="lg"
                onClick={() =>
                  router.push(`/login?redirect=/products/${product.slug}`)
                }
              >
                Sign in to begin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="accent"
                fullWidth
                size="lg"
                disabled={!photo || !consent || loading}
                loading={loading}
                onClick={handleStartTryOn}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Begin fitting
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
