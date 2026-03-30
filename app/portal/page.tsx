import { Activity, Clock, Heart, Moon, Upload } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal — Overview",
};

interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ElementType;
  readonly subtitle?: string;
}

function MetricCard({ label, value, icon: Icon, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xl font-bold text-card-foreground">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export default function PortalOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your health data at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Latest Analysis"
          value="Jun 14"
          icon={Activity}
          subtitle="2 days ago"
        />
        <MetricCard
          label="Sleep Score"
          value="82"
          icon={Moon}
          subtitle="7-day avg"
        />
        <MetricCard
          label="Recovery Trend"
          value="↑ Good"
          icon={Heart}
          subtitle="Improving over 14d"
        />
        <MetricCard
          label="Data Completeness"
          value="94%"
          icon={Clock}
          subtitle="Last 30 days"
        />
        <MetricCard
          label="Last Upload"
          value="Today"
          icon={Upload}
          subtitle="Apple Health export"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Recent Activity
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your latest analyses and reports will appear here once generated.
        </p>
      </div>
    </div>
  );
}
