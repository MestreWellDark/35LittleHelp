import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
    return {};
  }
}

function requireValue(condition, message) {
  if (!condition) failures.push(message);
}

const manifest = readJson("module.json");
const packageJson = readJson("package.json");
const english = readJson("lang/en.json");
const portuguese = readJson("lang/pt-BR.json");
const actorSheetScript = readFileSync(resolve(root, "scripts/features/actor-sheets.mjs"), "utf8");
const itemSheetScript = readFileSync(resolve(root, "scripts/features/item-sheets.mjs"), "utf8");
const styleSheet = readFileSync(resolve(root, "styles/d35e-little-helper.css"), "utf8");

requireValue(manifest.id === "d35e-little-helper", "module.json has an unexpected id");
requireValue(manifest.version === packageJson.version, "module.json and package.json versions differ");
requireValue(manifest.compatibility?.minimum === "13", "Foundry minimum must be 13");
requireValue(manifest.compatibility?.verified === "13", "Foundry verified version must be 13");

const d35e = manifest.relationships?.systems?.find((system) => system.id === "D35E");
requireValue(Boolean(d35e), "D35E system relationship is missing");
requireValue(d35e?.compatibility?.minimum === "3.1.0", "D35E minimum must be 3.1.0");
requireValue(d35e?.compatibility?.verified === "3.1.0", "D35E verified version must be 3.1.0");

for (const path of [
  ...(manifest.esmodules ?? []),
  ...(manifest.styles ?? []),
  ...(manifest.languages ?? []).map((language) => language.path),
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
]) {
  requireValue(existsSync(resolve(root, path)), `Referenced file does not exist: ${path}`);
}

const englishKeys = Object.keys(english).sort();
const portugueseKeys = Object.keys(portuguese).sort();
requireValue(
  JSON.stringify(englishKeys) === JSON.stringify(portugueseKeys),
  "English and Portuguese localization keys differ"
);

requireValue(
  !actorSheetScript.includes('createElement("section", {\n    className: "d35elh-actor-summary"'),
  "Actor helper must not use a flex-expanding section element"
);
requireValue(
  !itemSheetScript.includes('createElement("section", { className: "d35elh-item-helper" })'),
  "Item helper must not use a flex-expanding section element"
);
requireValue(
  /\.D35E\.sheet \.d35elh-actor-summary,[\s\S]*?flex:\s*0 0 auto !important;/.test(styleSheet),
  "D35E actor helper is missing the flex layout guard"
);

for (const urlKey of ["url", "manifest", "download"]) {
  requireValue(/^https:\/\//.test(manifest[urlKey] ?? ""), `module.json ${urlKey} must be HTTPS`);
}

if (failures.length) {
  console.error("Validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${manifest.title} v${manifest.version} with ${englishKeys.length} localization keys.`);
