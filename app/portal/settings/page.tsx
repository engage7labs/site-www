import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal — Settings",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your portal preferences
        </p>
      </div>

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

        {/* Data section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground">
            Data &amp; Privacy
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your data is processed on-device or in a single ephemeral session.
            Nothing is stored beyond what you see in your reports.
          </p>
        </div>
      </div>
    </div>
  );
}
