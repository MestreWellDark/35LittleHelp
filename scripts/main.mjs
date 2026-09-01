import {
  MODULE_ID,
  MODULE_TITLE,
  TARGET_SYSTEM_ID,
  TARGET_SYSTEM_VERSION
} from "./constants.mjs";
import { analyzeD20Rolls, estimateCarriedLoad } from "./core/analyzers.mjs";
import { registerSettings } from "./settings.mjs";
import { registerActorSheetEnhancements } from "./features/actor-sheets.mjs";
import { registerItemSheetEnhancements } from "./features/item-sheets.mjs";
import { registerChatEnhancements } from "./features/chat.mjs";
import { refreshBuffPanel, registerTokenHudEnhancements } from "./features/token-hud.mjs";
import { registerSceneEnhancements } from "./features/scenes.mjs";
import { registerDocumentEnhancements } from "./features/documents.mjs";
import { registerDialogEnhancements } from "./features/dialogs.mjs";
import { t, tf } from "./utils/dom.mjs";

Hooks.once("init", () => {
  registerSettings();
  registerActorSheetEnhancements();
  registerItemSheetEnhancements();
  registerChatEnhancements();
  registerTokenHudEnhancements();
  registerSceneEnhancements();
  registerDocumentEnhancements();
  registerDialogEnhancements();

  console.info(`${MODULE_TITLE} | Initialized`);
});

Hooks.once("ready", () => {
  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = Object.freeze({
      analyzeD20Rolls,
      estimateCarriedLoad,
      refreshBuffPanel,
      version: module.version
    });
  }

  if (game.system.id !== TARGET_SYSTEM_ID) {
    if (game.user?.isGM) {
      ui.notifications?.error(tf(
        "D35ELH.Compatibility.WrongSystem",
        { system: TARGET_SYSTEM_ID },
        `${MODULE_TITLE} requires the ${TARGET_SYSTEM_ID} system.`
      ));
    }
    return;
  }

  refreshBuffPanel();

  if (game.user?.isGM && game.system.version !== TARGET_SYSTEM_VERSION) {
    ui.notifications?.warn(tf(
      "D35ELH.Compatibility.Version",
      { tested: TARGET_SYSTEM_VERSION, current: game.system.version },
      `${MODULE_TITLE} was tested with D35E ${TARGET_SYSTEM_VERSION}; current version: ${game.system.version}.`
    ));
  } else {
    console.info(t("D35ELH.Ready", `${MODULE_TITLE} ready`));
  }
});
