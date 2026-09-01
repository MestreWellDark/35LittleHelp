import { FEATURE_KEYS } from "../constants.mjs";
import { analyzeD20Rolls } from "../core/analyzers.mjs";
import { featureEnabled } from "../settings.mjs";
import { copyText, createElement, rootElement, t, tf } from "../utils/dom.mjs";

function messageRolls(message) {
  if (Array.isArray(message?.rolls) && message.rolls.length) return message.rolls;
  return message?.roll ? [message.roll] : [];
}

function addBadge(header, className, text, title) {
  if (!header || header.querySelector(`.${className}`)) return;
  header.append(createElement("span", { className: `d35elh-roll-badge ${className}`, text, title }));
}

function enhanceD20(message, root, rolls) {
  const analyses = analyzeD20Rolls(rolls);
  const header = root.querySelector(".message-header") ?? root;

  if (analyses.some((analysis) => analysis.hasCritical)) {
    root.classList.add("d35elh-natural-20");
    addBadge(
      header,
      "d35elh-critical",
      t("D35ELH.Chat.Natural20", "Natural 20"),
      t("D35ELH.Chat.Natural20Hint", "At least one active d20 result is 20.")
    );
  }

  if (analyses.some((analysis) => analysis.hasFumble)) {
    root.classList.add("d35elh-natural-1");
    addBadge(
      header,
      "d35elh-fumble",
      t("D35ELH.Chat.Natural1", "Natural 1"),
      t("D35ELH.Chat.Natural1Hint", "At least one active d20 result is 1.")
    );
  }

  const totals = [...root.querySelectorAll(".dice-total")];
  analyses.forEach((analysis, index) => {
    if (analysis.modifier === null || !totals[index]) return;
    const sign = analysis.modifier >= 0 ? "+" : "";
    totals[index].insertAdjacentElement("afterend", createElement("span", {
      className: "d35elh-roll-modifier",
      text: tf(
        "D35ELH.Chat.Modifier",
        { modifier: `${sign}${analysis.modifier}` },
        `Modifier ${sign}${analysis.modifier}`
      )
    }));
  });
}

async function repeatRoll(message, sourceRoll) {
  if (!sourceRoll?.formula || !globalThis.Roll) return;

  try {
    const rollData = sourceRoll.data ?? {};
    const roll = await new Roll(sourceRoll.formula, rollData).evaluate();
    await roll.toMessage({
      speaker: message.speaker,
      flavor: t("D35ELH.Chat.RepeatedRoll", "Repeated roll"),
      whisper: message.whisper,
      blind: message.blind
    });
  } catch (error) {
    console.error("D35E Little Helper | Unable to repeat roll", error);
    ui.notifications?.error(t("D35ELH.Chat.RepeatFailed", "The roll could not be repeated."));
  }
}

function addRollTools(message, root, rolls) {
  const diceRolls = [...root.querySelectorAll(".dice-roll")];

  diceRolls.forEach((rollElement, index) => {
    if (rollElement.querySelector(".d35elh-roll-tools")) return;
    const sourceRoll = rolls[index] ?? rolls[0];
    if (!sourceRoll) return;

    const tools = createElement("div", { className: "d35elh-roll-tools" });
    const repeat = createElement("button", {
      className: "d35elh-icon-button",
      title: t("D35ELH.Chat.Repeat", "Repeat this roll"),
      attributes: { type: "button", "aria-label": t("D35ELH.Chat.Repeat", "Repeat this roll") }
    });
    repeat.append(createElement("i", { className: "fa-solid fa-rotate-right" }));
    repeat.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void repeatRoll(message, sourceRoll);
    });

    const copy = createElement("button", {
      className: "d35elh-icon-button",
      title: t("D35ELH.Chat.CopyFormula", "Copy formula"),
      attributes: { type: "button", "aria-label": t("D35ELH.Chat.CopyFormula", "Copy formula") }
    });
    copy.append(createElement("i", { className: "fa-solid fa-copy" }));
    copy.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const copied = await copyText(sourceRoll.formula);
      if (copied) ui.notifications?.info(t("D35ELH.Chat.FormulaCopied", "Formula copied."));
    });

    tools.append(repeat, copy);
    (rollElement.querySelector(".dice-result") ?? rollElement).append(tools);

    const formula = rollElement.querySelector(".dice-formula");
    if (formula && sourceRoll.formula) formula.title = sourceRoll.formula;
  });
}

function addCollapseButton(root) {
  const header = root.querySelector(".message-header");
  const content = root.querySelector(".message-content");
  if (!header || !content || header.querySelector(".d35elh-chat-collapse")) return;

  const button = createElement("button", {
    className: "d35elh-chat-collapse",
    title: t("D35ELH.Chat.ToggleDetails", "Show or hide message details"),
    attributes: { type: "button", "aria-label": t("D35ELH.Chat.ToggleDetails", "Show or hide message details") }
  });
  button.append(createElement("i", { className: "fa-solid fa-chevron-up" }));
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    root.classList.toggle("d35elh-collapsed");
    button.querySelector("i")?.classList.toggle("fa-chevron-up");
    button.querySelector("i")?.classList.toggle("fa-chevron-down");
  });

  header.append(button);
}

export function enhanceInlineRolls(html) {
  if (!featureEnabled(FEATURE_KEYS.CHAT_ENHANCEMENTS)) return;
  const root = rootElement(html);
  if (!root) return;

  for (const inline of root.querySelectorAll(".inline-roll, [data-formula]")) {
    const formula = inline.dataset?.formula ?? inline.getAttribute("data-formula");
    if (!formula) continue;
    inline.classList.add("d35elh-inline-formula");
    inline.title = tf("D35ELH.Chat.InlineFormula", { formula }, `Formula: ${formula}`);
  }
}

export function renderChatMessage(message, html) {
  if (!featureEnabled(FEATURE_KEYS.CHAT_ENHANCEMENTS)) return;

  const root = rootElement(html);
  if (!root || root.dataset.d35elhEnhanced === "true") return;
  root.dataset.d35elhEnhanced = "true";
  root.classList.add("d35elh-chat-message");

  const rolls = messageRolls(message);
  enhanceD20(message, root, rolls);
  addRollTools(message, root, rolls);
  addCollapseButton(root);
  enhanceInlineRolls(root);

  for (const card of root.querySelectorAll(".chat-card, .attack-card, .item-card")) {
    card.classList.add("d35elh-card");
  }
}

export function registerChatEnhancements() {
  Hooks.on("renderChatMessageHTML", renderChatMessage);
  Hooks.on("renderChatMessage", renderChatMessage);
  Hooks.on("renderChatLog", (_app, html) => enhanceInlineRolls(html));
  Hooks.on("renderChatPopout", (_app, html) => enhanceInlineRolls(html));
}
