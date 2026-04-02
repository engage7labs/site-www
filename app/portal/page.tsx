import { Clock, Crown, ExternalLink, Heart, Moon, Upload } from "lucide-react";
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
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 px-4 py-3">
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

function ShareCard() {
  return (
    <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
      <div className="flex items-center gap-3">
        <ExternalLink className="h-5 w-5 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Share Engage7
          </h3>
          <p className="text-xs text-muted-foreground">
            Share the product homepage with friends — not your data.
          </p>
        </div>
        <a
          href="https://www.engage7.ie"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Share
        </a>
      </div>
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
          label="Plan"
          value="Premium Trial"
          icon={Crown}
          subtitle="90 days included"
        />
        <MetricCard
          label="Sleep Score"
          value="—"
          icon={Moon}
          subtitle="Upload data to see"
        />
        <MetricCard
          label="Recovery Trend"
          value="—"
          icon={Heart}
          subtitle="Requires uploads"
        />
        <MetricCard
          label="Data Completeness"
          value="—"
          icon={Clock}
          subtitle="No uploads yet"
        />
        <MetricCard
          label="Uploads"
          value="0"
          icon={Upload}
          subtitle="Start by uploading"
        />
      </div>

      <ShareCard />

      <div className="portal-panel rounded-xl border border-border/70 bg-card/85 p-6">
        <h2 className="text-lg font-semibold text-card-foreground">
          Recent Analyses
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your analyses will appear here once you upload Apple Health exports.
          Upload multiple exports over time to track trends and accumulate
          insights.
        </p>
      </div>
    </div>
  );
}
