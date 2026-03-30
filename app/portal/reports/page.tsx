import { Eye, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal — My Reports",
};

interface ReportRow {
  id: string;
  date: string;
  label: string;
  status: "complete" | "processing" | "pending";
}

const PLACEHOLDER_REPORTS: ReportRow[] = [
  {
    id: "r-001",
    date: "2025-06-14",
    label: "Weekly Health Summary",
    status: "complete",
  },
  {
    id: "r-002",
    date: "2025-06-07",
    label: "Weekly Health Summary",
    status: "complete",
  },
  {
    id: "r-003",
    date: "2025-05-31",
    label: "Monthly Deep Dive",
    status: "complete",
  },
  {
    id: "r-004",
    date: "2025-05-24",
    label: "Weekly Health Summary",
    status: "complete",
  },
];

function StatusBadge({ status }: { status: ReportRow["status"] }) {
  const styles = {
    complete: "bg-accent/10 text-accent",
    processing: "bg-yellow-500/10 text-yellow-600",
    pending: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and download your generated health reports
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Report
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_REPORTS.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-card-foreground">
                    {report.date}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-card-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {report.label}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
