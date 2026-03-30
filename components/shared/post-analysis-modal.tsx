"use client";

import {
  Download,
  ExternalLink,
  Mail,
  MessageSquareText,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type FeedbackValue = "made_sense" | "not_sure" | "didnt_make_sense";

interface PostAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onFeedback: (value: FeedbackValue, note?: string) => void;
  onEmailSubmit: (email: string) => void;
  onShare: () => void;
}

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackValue;
  label: string;
}> = [
  { value: "made_sense", label: "👍 Made sense" },
  { value: "not_sure", label: "🤔 Not sure" },
  { value: "didnt_make_sense", label: "😕 Didn't make sense" },
];

export function PostAnalysisModal({
  open,
  onClose,
  onDownload,
  onFeedback,
  onEmailSubmit,
  onShare,
}: Readonly<PostAnalysisModalProps>) {
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [shared, setShared] = useState(false);

  const canSubmitEmail = useMemo(() => email.trim().length > 0, [email]);

  if (!open) return null;

  const handleFeedbackClick = (value: FeedbackValue) => {
    setFeedback(value);
    onFeedback(value, note.trim() || undefined);
  };

  const handleEmailSubmit = () => {
    const normalized = email.trim();
    if (!normalized) return;
    onEmailSubmit(normalized);
    setEmail("");
  };

  const handleShareClick = async () => {
    onShare();
    setShared(true);
    setTimeout(() => setShared(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              Your report is ready
            </h2>
            <p className="text-sm text-muted-foreground">
              You can download it now. If you want, share quick feedback below.
            </p>
          </div>

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Quick feedback
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFeedbackClick(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    feedback === option.value
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="feedback-note"
            >
              <span className="inline-flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" />
                Optional note
              </span>
            </label>
            <textarea
              id="feedback-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything surprising or confusing?"
              className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="updates-email"
            >
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Optional email
              </span>
            </label>
            <div className="flex gap-2">
              <input
                id="updates-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to receive updates"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
              />
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={!canSubmitEmail}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={handleShareClick}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/40"
            >
              <ExternalLink className="h-4 w-4" />
              {shared ? "Link copied" : "Share Engage7"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
