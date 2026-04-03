"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const canDelete = confirmText === "DELETE";

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/proxy/users/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { detail?: string; error?: string }).detail ||
            (data as { detail?: string; error?: string }).error ||
            "Deletion failed. Please try again."
        );
      }
      // Session cookie cleared by proxy on success — show success then redirect
      setDeleted(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
      setDeleting(false);
    }
  };

  if (deleted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="rounded-full bg-emerald-500/10 p-4">
          <svg
            className="h-8 w-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground">Account deleted</p>
        <p className="text-sm text-muted-foreground">
          Your account and data have been removed. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Profile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Account details and preferences will be configurable here in a
            future update.
          </p>
        </div>

        {/* Data & Privacy section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Data &amp; Privacy
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your data is processed on-device or in a single ephemeral session.
            Only data you explicitly agreed to store is saved to your portal.
          </p>
        </div>
      </div>

      {/* Delete account section */}
      <div className="rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="text-sm font-semibold text-destructive">
          Delete my account and data
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This permanently deletes your account and all stored processed data.
          This action cannot be undone. You may create a new account with the
          same email afterwards.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmText("");
            setDeleteError(null);
            setShowDeleteModal(true);
          }}
          className="mt-4 inline-flex items-center rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
        >
          Delete account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Confirm account deletion
            </h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete your account and all stored processed
              health data. To confirm, type{" "}
              <span className="font-mono font-bold text-foreground">
                DELETE
              </span>{" "}
              below.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-destructive"
              autoComplete="off"
            />
            {deleteError && (
              <p className="text-xs text-destructive">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || deleting}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
