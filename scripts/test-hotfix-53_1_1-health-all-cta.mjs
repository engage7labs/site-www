import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/portal/health/page.tsx", "utf8");
const english = readFileSync("lib/i18n/dictionaries/en-IE.ts", "utf8");
const portuguese = readFileSync("lib/i18n/dictionaries/pt-BR.ts", "utf8");

assert.match(page, /href="\/portal\/health\/all"/);
assert.match(page, /t\.portal\.health\.overviewViewAllData/);
assert.match(english, /overviewViewAllData: "View all data"/);
assert.match(portuguese, /overviewViewAllData: "Ver todos os dados"/);

console.log("HOTFIX 53.1.1 Health all-data CTA regression passed.");
