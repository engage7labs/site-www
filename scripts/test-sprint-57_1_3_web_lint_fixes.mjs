import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [feedback, upload, trends, health, homepage, adminDetail, artifacts] = await Promise.all([
  read("components/portal/briefing-feedback.tsx"),
  read("app/portal/upload/page.tsx"),
  read("app/portal/trends/page.tsx"),
  read("app/portal/health/health-dashboard.tsx"),
  read("app/page.tsx"),
  read("app/admin/users/[id]/page.tsx"),
  read("app/admin/ai-artifacts/page.tsx"),
]);

assert.match(feedback, /\[feedbackType, context, submitted, sending, surface\]/);
assert.match(upload, /const completionMessage = t\.common\.status\.complete/);
assert.match(upload, /\[activeJobId, status, router, completionMessage\]/);
assert.match(trends, /\[correlations, sleepDuration, hrv, heartRate, dailySteps, activeMinutes\]/);
assert.match(health, /const \[hasLoadError, setHasLoadError\] = useState\(false\)/);
assert.match(health, /body=\{t\.portal\.health\.loadError\}/);
assert.match(homepage, /const moveLightbox = useCallback/);
assert.match(homepage, /\[selectedIndex, moveLightbox\]/);
assert.match(homepage, /<Image[\s\S]*?sizes="\(min-width: 768px\) 280px, 78vw"/);
assert.doesNotMatch(homepage, /<img/);
assert.match(adminDetail, /import Link from "next\/link"/);
assert.doesNotMatch(adminDetail, /<a href="\/admin\/users"/);
assert.match(artifacts, /const load = useCallback\(async \(\) =>/);
assert.match(artifacts, /\}, \[load\]\);/);

console.log("Sprint 57.1.3 Web lint-fix checks passed.");
