import { FEATURE_KEYS } from "../constants.mjs";
import { featureEnabled } from "../settings.mjs";
import { debounce, rootElement, t, tf } from "../utils/dom.mjs";

function actorFor(app) {
  return app?.actor
    ?? app?.document?.actor
    ?? globalThis.canvas?.tokens?.controlled?.at?.(-1)?.actor
    ?? globalThis.canvas?.tokens?.controlled?.[0]?.actor
    ?? null;
}

function looksLikeFormula(value) {
  return /(?:\b\d*d\d+\b|@[A-Za-z][\w.]*)/i.test(String(value ?? ""));
}

function resolveFormula(formula, data) {
  try {
    if (!globalThis.Roll?.replaceFormulaData) return formula;
    return Roll.replaceFormulaData(formula, data, { missing: "0", warn: false });
  } catch {
    return formula;
  }
}

function validFormula(formula) {
  try {
    return globalThis.Roll?.validate ? Roll.validate(formula) : true;
  } catch {
    return false;
  }
}

function annotate(input, rollData) {
  const formula = input.value;
  if (!looksLikeFormula(formula)) {
    input.classList.remove("d35elh-formula-valid", "d35elh-formula-invalid");
    input.removeAttribute("data-d35elh-formula");
    return;
  }

  const resolved = resolveFormula(formula, rollData);
  const valid = validFormula(resolved);
  input.dataset.d35elhFormula = resolved;
  input.classList.toggle("d35elh-formula-valid", valid);
  input.classList.toggle("d35elh-formula-invalid", !valid);
  input.title = valid
    ? tf("D35ELH.Formula.Resolved", { formula: resolved }, `Resolved: ${resolved}`)
    : t("D35ELH.Formula.Invalid", "This formula is not valid with the current roll data.");
}

export function enhanceFormulaFields(app, html) {
  if (!featureEnabled(FEATURE_KEYS.FORMULA_HELPERS)) return;
  const root = rootElement(html);
  if (!root) return;

  const rollData = actorFor(app)?.getRollData?.() ?? {};
  const fields = [...root.querySelectorAll('input[type="text"], textarea')];
  for (const field of fields) annotate(field, rollData);

  if (root.dataset.d35elhFormulaListeners === "true") return;
  root.dataset.d35elhFormulaListeners = "true";

  const update = debounce((event) => {
    const field = event.target;
    if (field?.matches?.('input[type="text"], textarea')) annotate(field, rollData);
  }, 100);

  root.addEventListener("input", update);
  root.addEventListener("focusin", (event) => {
    const field = event.target;
    if (field?.matches?.('input[type="number"], input[data-dtype="Number"]')) field.select?.();
  });
}

export function registerDialogEnhancements() {
  Hooks.on("renderDialog", enhanceFormulaFields);
  Hooks.on("renderActorSheet", enhanceFormulaFields);
  Hooks.on("renderItemSheet", enhanceFormulaFields);
}
