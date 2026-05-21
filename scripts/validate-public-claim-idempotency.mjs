import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const helper = read("lib/public-analysis-claim.ts");
const shell = read("components/portal/portal-shell.tsx");
const loginFields = read("components/shared/login-form-fields.tsx");
const en = read("lib/i18n/dictionaries/en-IE.ts");
const pt = read("lib/i18n/dictionaries/pt-BR.ts");

assert(helper.includes("engage7.publicClaim.consumed."), "terminal claim state key missing");
assert(helper.includes("engage7.publicClaim.toastQueue"), "deferred toast queue key missing");
assert(helper.includes("engage7_consumed_public_claim_job_ids"), "consumed claim key missing");
assert(helper.includes("markPublicClaimConsumed"), "success cleanup helper missing");
assert(helper.includes("hasConsumedPublicClaim"), "stale pending suppression helper missing");
assert(helper.includes("consumePendingPublicClaimForToast"), "central claim/toast consumer missing");
assert(helper.includes("consumePublicClaimToast"), "toast terminal-state helper missing");
assert(
  helper.includes('result.claim_status === "already_imported"') &&
    helper.includes('result.claim_status === "imported_now"'),
  "claim helper does not consume both imported_now and already_imported responses",
);
assert(
  shell.includes("consumePendingPublicClaimForToast") &&
    shell.includes('decision.final_status === "already_imported"'),
  "PortalShell is not using the central claim/toast decision",
);
assert(
  shell.includes('session?.mode === "admin_view"') &&
    shell.includes("session?.read_only === true"),
  "PortalShell does not suppress claim consumption in admin view/read-only mode",
);
assert(
  !loginFields.includes("claimPendingPublicAnalysis") &&
    loginFields.includes("rememberPendingPublicClaim"),
  "Login form must remember, not consume, pending public claims",
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
