import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { formatHiddenStepOutliersMessage, getReportDisplayName } = await import(
  "../lib/portal-copy.ts"
);
const { enIE } = await import("../lib/i18n/dictionaries/en-IE.ts");
const { ptBR } = await import("../lib/i18n/dictionaries/pt-BR.ts");

const ptReport = ptBR.portal.reportDetail.table;
const enReport = enIE.portal.reportDetail.table;

assert.equal(ptReport.date, "Data");
assert.equal(ptReport.report, "Relatório");
assert.equal(ptReport.period, "Período");
assert.equal(ptReport.status, "Status");
assert.equal(ptReport.action, "Ação");
assert.equal(ptReport.updated, "Atualizado");
assert.equal(ptReport.view, "Ver");
assert.equal(ptReport.healthAnalysis, "Análise de saúde");
assert.equal(enReport.date, "Date");
assert.equal(enReport.report, "Report");
assert.equal(enReport.period, "Period");
assert.equal(enReport.status, "Status");
assert.equal(enReport.action, "Action");
assert.equal(enReport.updated, "Updated");
assert.equal(enReport.view, "View");
assert.equal(enReport.healthAnalysis, "Health Analysis");

assert.equal(
  formatHiddenStepOutliersMessage(0, {
    plural: ptBR.portal.health.hiddenStepOutliers,
    singular: ptBR.portal.health.hiddenStepOutliersSingular,
  }),
  "0 valores extremos de passos estão ocultos da escala do gráfico.",
);
assert.equal(
  formatHiddenStepOutliersMessage(1, {
    plural: ptBR.portal.health.hiddenStepOutliers,
    singular: ptBR.portal.health.hiddenStepOutliersSingular,
  }),
  "1 valor extremo de passos está oculto da escala do gráfico.",
);
assert.equal(
  formatHiddenStepOutliersMessage(2, {
    plural: ptBR.portal.health.hiddenStepOutliers,
    singular: ptBR.portal.health.hiddenStepOutliersSingular,
  }),
  "2 valores extremos de passos estão ocultos da escala do gráfico.",
);
assert.equal(
  formatHiddenStepOutliersMessage(8, {
    plural: ptBR.portal.health.hiddenStepOutliers,
    singular: ptBR.portal.health.hiddenStepOutliersSingular,
  }),
  "8 valores extremos de passos estão ocultos da escala do gráfico.",
);

assert.equal(
  getReportDisplayName(
    { report_label: null, upload_status: "imported" },
    ptReport,
  ),
  "Análise pública reivindicada",
);
assert.equal(
  getReportDisplayName(
    { report_label: null, upload_status: "queued" },
    ptReport,
  ),
  "Análise de saúde",
);
assert.equal(
  getReportDisplayName(
    { report_label: "Custom label", upload_status: "queued" },
    ptReport,
    "pt-BR",
  ),
  "Custom label",
);
assert.equal(
  getReportDisplayName(
    {
      report_label: "Claimed public analysis 2017-12-04 to 2026-05-20",
      upload_status: "imported",
    },
    ptReport,
    "pt-BR",
  ),
  "Análise pública reivindicada 2017-12-04 a 2026-05-20",
);
assert.equal(
  getReportDisplayName(
    {
      report_label: "Claimed public analysis 2017-12-04 to 2026-05-20",
      upload_status: "imported",
    },
    enReport,
    "en-IE",
  ),
  "Claimed public analysis 2017-12-04 to 2026-05-20",
);
assert.equal(
  getReportDisplayName(
    {
      report_label: "Health analysis 2018-01-01 to 2018-12-31",
      upload_status: "completed",
    },
    ptReport,
    "pt-BR",
  ),
  "Análise de saúde 2018-01-01 a 2018-12-31",
);

const reportsSource = await readFile(
  new URL("../app/portal/reports/page.tsx", import.meta.url),
  "utf8",
);
assert.match(reportsSource, /loadingReports/);
assert.match(reportsSource, /reportDetail\.empty/);
assert.match(reportsSource, /copy\.date/);
assert.match(reportsSource, /copy\.view/);
assert.match(reportsSource, /getReportDisplayName\(/);

const healthSource = await readFile(
  new URL("../app/portal/health/health-dashboard.tsx", import.meta.url),
  "utf8",
);
assert.match(healthSource, /formatHiddenStepOutliersMessage\(/);

console.log("Sprint 52.1.0 Portal copy polish checks passed.");