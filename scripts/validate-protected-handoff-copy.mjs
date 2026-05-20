import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const pt = read("lib/i18n/dictionaries/pt-BR.ts");
const en = read("lib/i18n/dictionaries/en-IE.ts");
const modal = read("components/shared/post-analysis-modal.tsx");
const preview = read("components/insights/insight-preview.tsx");

assert(
  pt.includes('cta: "Entrar para atualizar meu Portal"'),
  "pt-BR protected handoff CTA is missing",
);
assert(
  pt.includes('title: "Entre para atualizar seu Portal"'),
  "pt-BR protected handoff modal title is missing",
);
assert(
  !pt.includes(
    "This export appears to match a protected Engage7 timeline. Sign in to continue updating your data.",
  ),
  "pt-BR dictionary contains English protected handoff body",
);
assert(
  en.includes('downloadButton: "Open my Premium Free Portal"'),
  "normal English Premium Free CTA changed unexpectedly",
);
assert(
  pt.includes('downloadButton: "Abrir meu Portal Premium Free"'),
  "normal pt-BR Premium Free CTA changed unexpectedly",
);
assert(
  modal.includes('mode?: "premium" | "protected-handoff"'),
  "modal does not expose protected handoff mode",
);
assert(
  modal.includes("{!isProtectedHandoff && <div") &&
    modal.includes('htmlFor="premium-email"') &&
    modal.includes('id="consent-checkbox"'),
  "modal no longer keeps premium email/consent controls behind the normal mode branch",
);
assert(
  preview.includes('result.handoff?.status === "protected_timeline_login_required"'),
  "preview does not branch on protected handoff status",
);

console.log("protected handoff copy/modal checks passed");
