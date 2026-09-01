import { FEATURE_KEYS, MODULE_ID } from "./constants.mjs";

const SETTINGS = [
  ["enabled", "world", Boolean, true],
  [FEATURE_KEYS.ACTOR_SUMMARY, "client", Boolean, true],
  [FEATURE_KEYS.CHAT_ENHANCEMENTS, "client", Boolean, true],
  [FEATURE_KEYS.TOKEN_HUD_LABELS, "client", Boolean, true],
  [FEATURE_KEYS.ACTIVE_BUFFS_PANEL, "client", Boolean, true],
  [FEATURE_KEYS.SCENE_WARNINGS, "world", Boolean, true],
  [FEATURE_KEYS.DOCUMENT_IDS, "client", Boolean, true],
  [FEATURE_KEYS.FORMULA_HELPERS, "client", Boolean, true],
  [FEATURE_KEYS.COMPACT_SHEETS, "client", Boolean, false],
  [FEATURE_KEYS.AUTO_EXPAND_FOLDERS, "client", Boolean, false],
  ["includeCoinWeight", "world", Boolean, true],
  ["coinsPerWeightUnit", "world", Number, 50]
];

function settingKeyName(key) {
  return `D35ELH.Settings.${key}.Name`;
}

function settingKeyHint(key) {
  return `D35ELH.Settings.${key}.Hint`;
}

export function registerSettings() {
  for (const [key, scope, type, defaultValue] of SETTINGS) {
    game.settings.register(MODULE_ID, key, {
      name: settingKeyName(key),
      hint: settingKeyHint(key),
      scope,
      config: true,
      type,
      default: defaultValue,
      requiresReload: false
    });
  }
}

export function setting(key, fallback = true) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

export function featureEnabled(key) {
  return setting("enabled", true) !== false && setting(key, true) !== false;
}
