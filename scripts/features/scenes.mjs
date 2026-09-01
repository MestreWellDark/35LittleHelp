import { FEATURE_KEYS } from "../constants.mjs";
import { featureEnabled } from "../settings.mjs";
import { createElement, rootElement, t, tf } from "../utils/dom.mjs";

const warnedScenes = new Set();

function tokenActor(token) {
  return token?.actor ?? game.actors?.get(token?.actorId);
}

export function inspectScene(scene) {
  if (!scene) return [];

  const warnings = [];
  const tokens = [...(scene.tokens ?? [])];
  const playerTokens = tokens.filter((token) => tokenActor(token)?.hasPlayerOwner);

  if (scene.tokenVision === false) {
    warnings.push(t("D35ELH.Scene.TokenVisionDisabled", "Token Vision is disabled."));
  }

  if (!playerTokens.length) {
    warnings.push(t("D35ELH.Scene.NoPlayerTokens", "No player-owned tokens are present."));
  } else if (!playerTokens.some((token) => token.sight?.enabled !== false)) {
    warnings.push(t("D35ELH.Scene.NoTokenSight", "No player token has sight enabled."));
  }

  const unlinked = playerTokens.filter((token) => token.actorLink === false);
  if (unlinked.length) {
    warnings.push(tf(
      "D35ELH.Scene.UnlinkedTokens",
      { count: unlinked.length },
      `${unlinked.length} player token(s) are not linked.`
    ));
  }

  return warnings;
}

export function onCanvasReady(canvasInstance) {
  if (!featureEnabled(FEATURE_KEYS.SCENE_WARNINGS) || !game.user?.isGM) return;

  const scene = canvasInstance?.scene ?? globalThis.canvas?.scene;
  if (!scene || warnedScenes.has(scene.id)) return;

  const warnings = inspectScene(scene);
  if (!warnings.length) return;

  warnedScenes.add(scene.id);
  ui.notifications?.warn(tf(
    "D35ELH.Scene.Warning",
    { scene: scene.name, warnings: warnings.join(" • ") },
    `${scene.name}: ${warnings.join(" • ")}`
  ));
}

export function renderSceneNavigation(_app, html) {
  if (!featureEnabled(FEATURE_KEYS.SCENE_WARNINGS) || !game.user?.isGM) return;
  const root = rootElement(html);
  if (!root) return;

  for (const scene of game.scenes ?? []) {
    const warnings = inspectScene(scene);
    const entry = root.querySelector(`[data-scene-id="${CSS.escape(scene.id)}"]`);
    if (!entry) continue;

    entry.querySelector(".d35elh-scene-warning")?.remove();
    if (!warnings.length) continue;

    const badge = createElement("span", {
      className: "d35elh-scene-warning",
      title: warnings.join("\n"),
      attributes: { "aria-label": t("D35ELH.Scene.WarningLabel", "Scene setup warning") }
    });
    badge.append(createElement("i", { className: "fa-solid fa-triangle-exclamation" }));
    entry.append(badge);
  }
}

export function registerSceneEnhancements() {
  Hooks.on("canvasReady", onCanvasReady);
  Hooks.on("renderSceneNavigation", renderSceneNavigation);
  Hooks.on("updateScene", (scene) => warnedScenes.delete(scene.id));
}
