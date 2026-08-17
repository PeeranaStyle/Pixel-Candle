"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submitFeedback() {
    if (message.trim().length < 2 || state === "sending") {
      return;
    }

    setState("sending");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      setMessage("");
      setState("sent");
      return;
    }

    setState("error");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pixel-text text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
      >
        have a thought?
      </button>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <div className="mb-2 flex items-center justify-between">
        <p className="pixel-text text-xs text-[color:var(--muted)]">have a thought?</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close feedback">
          <X size={15} />
        </button>
      </div>
      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setState("idle");
        }}
        rows={3}
        maxLength={600}
        placeholder="write feedback..."
        className="min-h-24 w-full resize-none border border-[rgba(39,32,25,0.18)] bg-transparent p-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)]"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="pixel-text text-xs text-[color:var(--muted)]" aria-live="polite">
          {state === "sent" ? "sent" : state === "error" ? "try again later" : ""}
        </p>
        <button
          type="button"
          onClick={submitFeedback}
          className="inline-flex size-8 items-center justify-center text-[color:var(--foreground)] transition hover:text-[color:var(--ember)] disabled:opacity-40"
          disabled={state === "sending"}
          aria-label="Send feedback"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
