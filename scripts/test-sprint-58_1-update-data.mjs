import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const page = source("app/portal/upload/page.tsx");
const proxy = source("app/api/proxy/portal/reanalyse/route.ts");
const en = source("lib/i18n/dictionaries/en-IE.ts");
const pt = source("lib/i18n/dictionaries/pt-BR.ts");

assert.match(page, /reanalyseTitle/);
assert.match(page, /handleReanalysis/);
assert.match(page, /window\.confirm/);
assert.match(page, /ACTIVE_UPDATE_JOB_KEY/);
assert.match(page, /returnToInsights/);
assert.match(page, /FileUpload/);
assert.match(page, /consentGiven/);
assert.match(proxy, /\/api\/users\/me\/reanalyse/);
assert.match(proxy, /admin_view/);
assert.match(en, /Reanalyse existing data/);
assert.match(pt, /Reanalisar dados existentes/);
assert.match(pt, /Atualizar dados/);
console.log("Sprint 58.1 Update Data Web regressions passed.");
