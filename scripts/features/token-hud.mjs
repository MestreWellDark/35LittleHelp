import { FEATURE_KEYS } from "../constants.mjs";
import { activeBuffItems } from "../core/analyzers.mjs";
import { featureEnabled } from "../settings.mjs";
import { createElement, debounce, rootElement, t, tf } from "../utils/dom.mjs";

function statusLabel(control) {
  const image = control.matches?.("img") ? control : control.querySelector?.("img");
  const source = image?.getAttribute("src") ?? "";
  const configured = (CONFIG.statusEffects ?? []).find((effect) => {
    const configuredSource = effect.img ?? effect.icon ?? "";
    return configuredSource && (source.endsWith(configuredSource) || configuredSource.endsWith(source));
  });

  const raw = configured?.name ?? configured?.label ?? image?.alt ?? image?.title ?? control.title ?? "";
  return raw ? t(raw, raw) : "";
}

export function renderTokenHud(_app, html) {
  if (!featureEnabled(FEATURE_KEYS.TOKEN_HUD_LABELS)) return;
  const root = rootElement(html);
  if (!root) return;

  const controls = [...root.querySelectorAll(".status-effects .effect-control")];
  for (const control of controls) {
    if (control.closest(".d35elh-effect-wrap")) continue;

    const label = statusLabel(control);
    if (!label) continue;

    if (control.matches("img")) {
      const wrapper = createElement("span", { className: "d35elh-effect-wrap", title: label });
      control.parentElement?.insertBefore(wrapper, control);
      wrapper.append(control, createElement("span", { className: "d35elh-effect-label", text: label }));
    } else {
      control.classList.add("d35elh-effect-wrap");
      control.append(createElement("span", { className: "d35elh-effect-label", text: label }));
      control.title = label;
    }
  }
}

function controlledToken() {
  return globalThis.canvas?.tokens?.controlled?.at?.(-1)
    ?? globalThis.canvas?.tokens?.controlled?.[0]
    ?? null;
}

function removePanel() {
  document.getElementById("d35elh-active-buffs")?.remove();
}

export function refreshBuffPanel() {
  if (!featureEnabled(FEATURE_KEYS.ACTIVE_BUFFS_PANEL)) {
    removePanel();
    return;
  }

  const token = controlledToken();
  const actor = token?.actor;
  const buffs = activeBuffItems(actor?.items);

  if (!token || !actor || !buffs.length) {
    removePanel();
    return;
  }

  const oldPanel = document.getElementById("d35elh-active-buffs");
  const panel = createElement("aside", {
    className: "d35elh-active-buffs",
    attributes: {
      id: "d35elh-active-buffs",
      "aria-label": t("D35ELH.HUD.ActiveBuffs", "Active buffs")
    }
  });

  const header = createElement("header");
  const title = createElement("strong", { text: actor.name });
  const meta = createElement("span", { className: "d35elh-buff-meta" });
  const reach = actor.system?.traits?.reach;

  meta.textContent = reach
    ? tf("D35ELH.HUD.Reach", { reach }, `Reach: ${reach}`)
    : tf("D35ELH.HUD.BuffCount", { count: buffs.length }, `${buffs.length} active buff(s)`);

  header.append(title, meta);
  panel.append(header);

  const list = createElement("div", { className: "d35elh-buff-list" });
  for (const buff of buffs) {
    const button = createElement("button", {
      className: "d35elh-buff",
      title: tf("D35ELH.HUD.OpenBuff", { name: buff.name }, `Open ${buff.name}`),
      attributes: { type: "button" }
    });

    const image = createElement("img", {
      attributes: {
        src: buff.img || "icons/svg/aura.svg",
        alt: ""
      }
    });
    button.append(image, createElement("span", { text: buff.name }));
    button.addEventListener("click", () => buff.sheet?.render(true));
    button.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      if (!buff.isOwner && !actor.isOwner) return;
      await buff.update({ "system.active": false });
    });
    list.append(button);
  }

  panel.append(list);

  if (token.name && token.name !== actor.name) {
    panel.append(createElement("p", {
      className: "d35elh-token-name-warning",
      text: tf(
        "D35ELH.HUD.TokenNameMismatch",
        { token: token.name, actor: actor.name },
        `Token name (${token.name}) differs from actor name (${actor.name}).`
      )
    }));
  }

  if (oldPanel) oldPanel.replaceWith(panel);
  else document.body.append(panel);
}

const scheduleRefresh = debounce(refreshBuffPanel, 60);

export function registerTokenHudEnhancements() {
  Hooks.on("renderTokenHUD", renderTokenHud);
  Hooks.on("controlToken", scheduleRefresh);
  Hooks.on("canvasReady", scheduleRefresh);
  Hooks.on("updateActor", scheduleRefresh);
  Hooks.on("updateItem", scheduleRefresh);
  Hooks.on("deleteItem", scheduleRefresh);
}
