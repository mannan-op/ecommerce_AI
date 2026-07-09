"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { sendStylistChatMessage, type StylistChatMessage } from "@/lib/api/tryon";
import { cn } from "@/lib/utils";

interface TryOnStylistChatProps {
  jobId: string;
  productName: string;
  variantLabel?: string | null;
  enabled: boolean;
  onBack: () => void;
}

const STARTER_PROMPTS = [
  "Does this size look right for me?",
  "What shoes would pair well with this?",
  "Is this suitable for a wedding?",
];

export function TryOnStylistChat({
  jobId,
  productName,
  variantLabel,
  enabled,
  onBack,
}: TryOnStylistChatProps) {
  const [messages, setMessages] = useState<StylistChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !enabled) return;

    setError(null);
    setInput("");
    const userMessage: StylistChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { reply } = await sendStylistChatMessage(jobId, trimmed, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach stylist.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs uppercase tracking-wider text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Groq
        </div>
        <h3 className="font-display text-xl">MAISON AI stylist</h3>
        <p className="mt-2 text-sm text-muted">
          Ask about fit, styling, and occasions for{" "}
          <span className="text-foreground">{productName}</span>
          {variantLabel ? ` (${variantLabel})` : ""}.
        </p>
      </div>

      {!enabled ? (
        <div className="rounded-2xl border border-border/60 bg-surface-elevated/50 px-4 py-4 text-center text-sm text-muted">
          AI stylist is not configured yet. Add{" "}
          <code className="text-xs">GROQ_API_KEY</code> to the backend environment.
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex max-h-[min(42vh,360px)] min-h-[220px] flex-col gap-3 overflow-y-auto rounded-3xl border border-border/60 bg-surface-elevated/40 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted">
            <p>Start a conversation — try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={!enabled || loading}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-accent text-primary"
                  : "mr-auto border border-border/60 bg-surface text-foreground"
              )}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading ? (
          <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border/60 bg-surface px-4 py-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Styling your look…
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about fit, sizing, or styling…"
          disabled={!enabled || loading}
          className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        />
        <Button
          type="submit"
          variant="accent"
          size="icon"
          disabled={!enabled || loading || !input.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <Button type="button" variant="ghost" fullWidth onClick={onBack}>
        Back to reveal
      </Button>
    </div>
  );
}
