import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const helper = read("lib/public-analysis-claim.ts");
const shell = read("components/portal/portal-shell.tsx");
const en = read("lib/i18n/dictionaries/en-IE.ts");
const pt = read("lib/i18n/dictionaries/pt-BR.ts");

assert(helper.includes("engage7_consumed_public_claim_job_ids"), "consumed claim key missing");
assert(helper.includes("markPublicClaimConsumed"), "success cleanup helper missing");
assert(helper.includes("hasConsumedPublicClaim"), "stale pending suppression helper missing");
assert(
  helper.includes('result.claim_status === "already_imported"') &&
    helper.includes('result.claim_status === "imported_now"'),
  "claim helper does not consume both imported_now and already_imported responses",
);
assert(
  shell.includes("claimAlreadyImported") &&
    shell.includes('result.claim_status === "already_imported"'),
  "PortalShell does not show already-imported copy",
);
assert(
  en.includes('claimAlreadyImported: "This analysis is already in your Portal."'),
  "English already-imported copy missing",
);
assert(
  pt.includes('claimAlreadyImported: "Esta análise já está no seu Portal."'),
  "pt-BR already-imported copy missing",
);

console.log("public claim idempotency copy/storage checks passed");
