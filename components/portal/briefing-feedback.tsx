/**
 * BriefingFeedback — Sprint 19.0
 *
 * "Was this helpful?" feedback widget for insights and briefings.
 * Posts authenticated feedback via /api/proxy/portal-feedback.
 */

"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useState } from "react";

interface BriefingFeedbackProps {
  /** Identifies what the feedback is about, e.g. "daily_briefing" */
  readonly feedbackType: string;
  /** Optional context label */
  readonly context?: string;
}

export function BriefingFeedback({
  feedbackType,
  context,
}: BriefingFeedbackProps) {
  const [submitted, setSubmitted] = useState<"yes" | "no" | null>(null);
  const [sending, setSending] = useState(false);

  const submit = useCallback(
    async (value: "yes" | "no") => {
      if (submitted || sending) return;
      setSending(true);
      try {
        await fetch("/api/proxy/portal-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback_type: `${feedbackType}_${value}`,
            note: context ?? null,
          }),
        });
        setSubmitted(value);
      } catch {
        // Silent — don't block UX on feedback failure
        setSubmitted(value);
      } finally {
        setSending(false);
      }
    },
    [feedbackType, context, submitted, sending]
  );

  if (submitted) {
    return (
      <p className="text-xs text-muted-foreground/70 italic">
        Thanks for the feedback.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <button
        type="button"
        onClick={() => submit("yes")}
        disabled={sending}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:opacity-50"
      >
        <ThumbsUp className="h-3 w-3" />
        Yes
      </button>
      <button
        type="button"
        onClick={() => submit("no")}
        disabled={sending}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground disabled:opacity-50"
      >
        <ThumbsDown className="h-3 w-3" />
        No
      </button>
    </div>
  );
}
