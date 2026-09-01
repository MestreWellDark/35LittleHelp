import { FEATURE_KEYS } from "../constants.mjs";
import { featureEnabled, setting } from "../settings.mjs";
import {
  classifyItems,
  collectSkillRankIssues,
  estimateCarriedLoad,
  findSlotIssues,
  spellbookDcSummaries
} from "../core/analyzers.mjs";
import { appRoot, createElement, rootElement, t, tf } from "../utils/dom.mjs";

function actorFor(app) {
  const document = app?.actor ?? app?.document ?? app?.object;
  return document?.documentName === "Actor" || document?.items ? document : null;
}

function localizedNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(game.i18n?.lang || "en", {
    maximumFractionDigits
  }).format(value);
}

function chip({ icon, label, value, title, tab }) {
  const button = createElement("button", {
    className: "d35elh-chip",
    title,
    attributes: { type: "button" }
  });
  button.dataset.tabTarget = tab || "";

  const iconNode = createElement("i", { className: `fa-solid ${icon}` });
  iconNode.setAttribute("aria-hidden", "true");
  button.append(iconNode, createElement("span", { text: label }));

  if (value !== undefined) {
    button.append(createElement("strong", { text: value }));
  }

  return button;
}

function activateTab(root, tab) {
  if (!tab) return;
  const selector = [
    `[data-tab="${CSS.escape(tab)}"]`,
    `[data-tab="${CSS.escape(tab.replace("spellbook", "spells"))}"]`
  ].join(",");

  root.querySelector(`.tabs ${selector}, nav ${selector}`)?.click();
}

function actorWarnings(actor) {
  const warnings = [];
  const level = actor.system?.details?.level?.value
    ?? actor.system?.attributes?.hd?.total
    ?? 0;

  const slots = findSlotIssues(actor.items);
  if (slots.length) {
    warnings.push(tf(
      "D35ELH.Actor.SlotWarning",
      { count: slots.length, names: slots.slice(0, 4).map((item) => item.name).join(", ") },
      `Equipped items without a slot: ${slots.slice(0, 4).map((item) => item.name).join(", ")}`
    ));
  }

  const skills = collectSkillRankIssues(actor.system?.skills, level);
  if (skills.length) {
    warnings.push(tf(
      "D35ELH.Actor.SkillWarning",
      { count: skills.length, names: skills.slice(0, 4).map((skill) => skill.name).join(", ") },
      `Skills above the rank limit: ${skills.slice(0, 4).map((skill) => skill.name).join(", ")}`
    ));
  }

  if (actor.type === "character" && actor.prototypeToken?.actorLink === false) {
    warnings.push(t(
      "D35ELH.Actor.UnlinkedPrototype",
      "The prototype token is not linked to this character."
    ));
  }

  return warnings;
}

function buildSummary(actor) {
  const summary = createElement("section", {
    className: "d35elh-actor-summary",
    attributes: {
      "aria-label": t("D35ELH.Actor.Summary", "Little Helper summary")
    }
  });

  const counts = classifyItems(actor.items);
  const load = estimateCarriedLoad(
    actor.items,
    actor.system?.currency,
    setting("coinsPerWeightUnit", 50),
    setting("includeCoinWeight", true)
  );

  const primary = createElement("div", { className: "d35elh-chip-row" });
  primary.append(
    chip({
      icon: "fa-box-open",
      label: t("D35ELH.Actor.Inventory", "Inventory"),
      value: counts.inventory,
      title: t("D35ELH.Actor.GoToInventory", "Open inventory"),
      tab: "inventory"
    }),
    chip({
      icon: "fa-star",
      label: t("D35ELH.Actor.Feats", "Feats"),
      value: counts.feats,
      title: t("D35ELH.Actor.GoToFeats", "Open features"),
      tab: "features"
    }),
    chip({
      icon: "fa-book-sparkles",
      label: t("D35ELH.Actor.Spells", "Spells"),
      value: counts.spells,
      title: t("D35ELH.Actor.GoToSpells", "Open spellbooks"),
      tab: "spellbook"
    }),
    chip({
      icon: "fa-bolt",
      label: t("D35ELH.Actor.Buffs", "Active buffs"),
      value: `${counts.activeBuffs}/${counts.buffs}`,
      title: t("D35ELH.Actor.GoToBuffs", "Open buffs"),
      tab: "buffs"
    }),
    chip({
      icon: "fa-weight-hanging",
      label: t("D35ELH.Actor.EstimatedLoad", "Estimated load"),
      value: localizedNumber(load.total),
      title: tf(
        "D35ELH.Actor.LoadBreakdown",
        {
          items: localizedNumber(load.itemWeight),
          coins: localizedNumber(load.coinWeight),
          count: localizedNumber(load.coins, 0)
        },
        `Items: ${localizedNumber(load.itemWeight)}; coins: ${localizedNumber(load.coinWeight)} (${localizedNumber(load.coins, 0)})`
      )
    })
  );

  summary.append(primary);

  const spellbooks = spellbookDcSummaries(actor.system);
  if (spellbooks.length) {
    const dcRow = createElement("div", { className: "d35elh-spellbook-row" });
    dcRow.append(createElement("span", {
      className: "d35elh-row-label",
      text: t("D35ELH.Actor.BaseSpellDC", "Base spell DC")
    }));

    for (const book of spellbooks.slice(0, 6)) {
      dcRow.append(chip({
        icon: "fa-wand-magic-sparkles",
        label: book.label,
        value: `${book.base} + ${t("D35ELH.Actor.SpellLevelShort", "SL")}`,
        title: book.formula
          ? tf("D35ELH.Actor.CustomDCFormula", { formula: book.formula }, `Custom formula: ${book.formula}`)
          : tf("D35ELH.Actor.DCFormula", { base: book.base }, `DC ${book.base} + spell level`),
        tab: "spellbook"
      }));
    }

    summary.append(dcRow);
  }

  const warnings = actorWarnings(actor);
  if (warnings.length) {
    const details = createElement("details", { className: "d35elh-warnings" });
    const heading = createElement("summary", {
      text: tf("D35ELH.Actor.WarningCount", { count: warnings.length }, `${warnings.length} warning(s)`)
    });
    const list = createElement("ul");

    for (const warning of warnings) list.append(createElement("li", { text: warning }));
    details.append(heading, list);
    summary.append(details);
  }

  summary.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-tab-target]");
    if (button) activateTab(summary.closest("form") ?? summary.parentElement, button.dataset.tabTarget);
  });

  return summary;
}

export function renderActorSheet(app, html) {
  if (!featureEnabled(FEATURE_KEYS.ACTOR_SUMMARY)) return;

  const root = rootElement(html);
  const actor = actorFor(app);
  if (!root || !actor) return;

  root.querySelector(".d35elh-actor-summary")?.remove();
  const form = root.matches("form") ? root : root.querySelector("form") ?? root;
  const summary = buildSummary(actor);
  const header = form.querySelector(".sheet-header, header");

  if (header) header.insertAdjacentElement("afterend", summary);
  else form.prepend(summary);

  appRoot(app, html)?.classList.toggle(
    "d35elh-compact",
    featureEnabled(FEATURE_KEYS.COMPACT_SHEETS)
  );
}

export function registerActorSheetEnhancements() {
  Hooks.on("renderActorSheet", renderActorSheet);
}
