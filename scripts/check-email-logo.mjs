import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "lib", "email.ts"), "utf8");
const logoUrl = "https://www.engage7.ie/engage7-logo-180x180.png";

assert(source.includes(logoUrl), "email templates must use the hosted PNG logo");
assert(source.includes('alt="Engage7 Labs"'), "email logo must keep Engage7 Labs alt text");
assert(source.includes('width="64"'), "email logo must use a compact header width");
assert(source.includes("display:block"), "email logo must use email-safe display:block style");
assert(source.includes("border:0"), "email logo must use email-safe border reset");
assert(!source.includes("cid:"), "email templates must not use CID logo references");
assert(!source.includes("contentId:"), "email logo must not be attached as CID");
assert(!source.includes("fetchInlineLogoAttachment"), "email logo must not be fetched as an attachment");
assert(!source.includes("logo-engage7-labs.svg"), "email templates must not reference SVG logo assets");
assert(!source.includes("image/svg+xml"), "email logo must not use SVG attachment content types");

console.log("email_logo_template_check=passed");
