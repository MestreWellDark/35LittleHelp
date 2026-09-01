import { FEATURE_KEYS } from "../constants.mjs";
import { featureEnabled } from "../settings.mjs";
import { createElement, rootElement, t, tf } from "../utils/dom.mjs";

function valuePresent(value) {
  return value !== undefined && value !== null && value !== "";
}

function warningsFor(item) {
  const system = item.system ?? {};
  const warnings = [];

  if (item.type === "equipment" && system.equipped === true && !valuePresent(system.slot)) {
    warnings.push(t("D35ELH.Item.EquippedWithoutSlot", "This equipped item has no body slot."));
  }

  if (item.type === "spell" && !valuePresent(system.level)) {
    warnings.push(t("D35ELH.Item.SpellWithoutLevel", "This spell has no spell level."));
  }

  if (system.uses?.per && !valuePresent(system.uses?.max) && !valuePresent(system.uses?.maxFormula)) {
    warnings.push(t("D35ELH.Item.UsesWithoutMaximum", "Usage recovery is set, but maximum uses are empty."));
  }

  return warnings;
}

function property(label, value) {
  const node = createElement("span", { className: "d35elh-item-property" });
  node.append(
    createElement("strong", { text: `${label}: ` }),
    createElement("span", { text: value })
  );
  return node;
}

function buildItemHelper(item) {
  const system = item.system ?? {};
  const helper = createElement("section", { className: "d35elh-item-helper" });
  const properties = createElement("div", { className: "d35elh-item-properties" });

  const range = [system.range?.value, system.range?.units].filter(valuePresent).join(" ");
  const duration = [system.duration?.value, system.duration?.units].filter(valuePresent).join(" ");
  const save = [system.save?.description, valuePresent(system.save?.dc) ? `DC ${system.save.dc}` : ""]
    .filter(valuePresent)
    .join(" ");

  if (range) properties.append(property(t("D35ELH.Item.Range", "Range"), range));
  if (duration) properties.append(property(t("D35ELH.Item.Duration", "Duration"), duration));
  if (save) properties.append(property(t("D35ELH.Item.Save", "Save"), save));
  if (valuePresent(system.sr)) properties.append(property(t("D35ELH.Item.SR", "SR"), system.sr));

  if (properties.childElementCount) helper.append(properties);

  const warnings = warningsFor(item);
  if (warnings.length) {
    const details = createElement("details", { className: "d35elh-warnings" });
    details.append(createElement("summary", {
      text: tf("D35ELH.Item.WarningCount", { count: warnings.length }, `${warnings.length} warning(s)`)
    }));

    const list = createElement("ul");
    for (const warning of warnings) list.append(createElement("li", { text: warning }));
    details.append(list);
    helper.append(details);
  }

  return helper;
}

export function renderItemSheet(app, html) {
  if (!featureEnabled(FEATURE_KEYS.ACTOR_SUMMARY)) return;

  const root = rootElement(html);
  const item = app?.item ?? app?.document ?? app?.object;
  if (!root || !item?.system) return;

  root.querySelector(".d35elh-item-helper")?.remove();
  const helper = buildItemHelper(item);
  if (!helper.childElementCount) return;

  const form = root.matches("form") ? root : root.querySelector("form") ?? root;
  const header = form.querySelector(".sheet-header, header");
  if (header) header.insertAdjacentElement("afterend", helper);
  else form.prepend(helper);
}

export function registerItemSheetEnhancements() {
  Hooks.on("renderItemSheet", renderItemSheet);
}
