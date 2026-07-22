import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ACTIVE_ANALYTICS_CONTRACT,
  isAnalyticsReuploadRequired,
} from "../lib/analytics-status.ts";

const current = {
  active_contract: ACTIVE_ANALYTICS_CONTRACT,
  data_state: "CURRENT_V2",
  requires_reupload: false,
  reason_code: "CURRENT_CONTRACT_DATA_AVAILABLE",
};
const legacy = {
  active_contract: ACTIVE_ANALYTICS_CONTRACT,
  data_state: "LEGACY_V1_REUPLOAD_REQUIRED",
  requires_reupload: true,
  reason_code: "LEGACY_CONTRACT_DATA_ONLY",
};
const newUser = {
  active_contract: ACTIVE_ANALYTICS_CONTRACT,
  data_state: "NO_ANALYTICAL_DATA",
  requires_reupload: false,
  reason_code: "NO_ANALYTICAL_DATA",
};

assert.equal(isAnalyticsReuploadRequired(legacy), true);
assert.equal(isAnalyticsReuploadRequired(current), false);
assert.equal(isAnalyticsReuploadRequired(newUser), false);
assert.equal(isAnalyticsReuploadRequired(null), false);
assert.equal(isAnalyticsReuploadRequired({ ...legacy, active_contract: "user_feature_store.v1" }), false);

const [banner, shell, proxy, english, portuguese] = await Promise.all([
  readFile(new URL("../components/portal/analytics-reupload-banner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/portal/portal-shell.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/api/proxy/users/analytics-status/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/i18n/dictionaries/en-IE.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/i18n/dictionaries/pt-BR.ts", import.meta.url), "utf8"),
]);

assert.match(shell, /<AnalyticsReuploadBanner \/>/);
assert.equal((shell.match(/<AnalyticsReuploadBanner \/>/g) ?? []).length, 1);
assert.match(banner, /href="\/portal\/upload"/);
assert.match(banner, /t\.portal\.analyticsReupload\.title/);
assert.match(banner, /if \(!response\.ok\) return/);
assert.doesNotMatch(banner, /Your health data needs to be updated/);
assert.match(proxy, /const path = "\/api\/users\/me\/analytics-status"/);
assert.match(proxy, /"X-User-Id": session\.user_id/);
assert.doesNotMatch(proxy, /"X-User-Email"/);
assert.doesNotMatch(proxy, /searchParams|query|email=/);

assert.match(english, /Your health data needs to be updated/);
assert.match(english, /Upload your Apple Health export again/);
assert.match(english, /Upload data again/);
assert.match(portuguese, /Seus dados de saúde precisam ser atualizados/);
assert.match(portuguese, /Envie novamente seu arquivo do Apple Health/);
assert.match(portuguese, /Enviar dados novamente/);

console.log("analytics status banner contract: ok");
