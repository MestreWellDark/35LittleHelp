import { FEATURE_KEYS } from "../constants.mjs";
import { featureEnabled } from "../settings.mjs";
import { copyText, rootElement, safeDatasetId, t, tf } from "../utils/dom.mjs";

const DIRECTORY_CONTEXTS = [
  ["getActorDirectoryEntryContext", "actors"],
  ["getItemDirectoryEntryContext", "items"],
  ["getSceneDirectoryEntryContext", "scenes"],
  ["getJournalDirectoryEntryContext", "journal"],
  ["getRollTableDirectoryEntryContext", "tables"],
  ["getMacroDirectoryEntryContext", "macros"],
  ["getPlaylistDirectoryEntryContext", "playlists"]
];

const SHEET_HEADER_HOOKS = [
  "getActorSheetHeaderButtons",
  "getItemSheetHeaderButtons",
  "getJournalSheetHeaderButtons",
  "getRollTableSheetHeaderButtons"
];

const DIRECTORY_RENDER_HOOKS = [
  "renderActorDirectory",
  "renderItemDirectory",
  "renderSceneDirectory",
  "renderJournalDirectory",
  "renderRollTableDirectory",
  "renderCompendiumDirectory"
];

async function copyDocument(document) {
  const value = document?.uuid ?? document?.id;
  if (!value) return;

  const copied = await copyText(value);
  if (copied) {
    ui.notifications?.info(tf(
      "D35ELH.Documents.Copied",
      { id: value },
      `Copied: ${value}`
    ));
  }
}

function addDirectoryContext(hookName, collectionName) {
  Hooks.on(hookName, (_html, options) => {
    if (!featureEnabled(FEATURE_KEYS.DOCUMENT_IDS)) return;

    options.push({
      name: t("D35ELH.Documents.CopyUuid", "Copy UUID"),
      icon: '<i class="fa-solid fa-fingerprint"></i>',
      condition: (entry) => Boolean(safeDatasetId(entry)),
      callback: (entry) => {
        const id = safeDatasetId(entry);
        const document = game[collectionName]?.get(id);
        return copyDocument(document ?? { id });
      }
    });
  });
}

function addSheetHeaderButton(hookName) {
  Hooks.on(hookName, (app, buttons) => {
    if (!featureEnabled(FEATURE_KEYS.DOCUMENT_IDS)) return;
    const document = app?.document ?? app?.actor ?? app?.item ?? app?.object;
    if (!document) return;

    buttons.unshift({
      label: t("D35ELH.Documents.Id", "ID"),
      class: "d35elh-copy-document-id",
      icon: "fa-solid fa-fingerprint",
      onclick: () => copyDocument(document)
    });
  });
}

function autoExpandFolders(_app, html) {
  if (!featureEnabled(FEATURE_KEYS.AUTO_EXPAND_FOLDERS)) return;
  const root = rootElement(html);
  if (!root) return;

  for (const folder of root.querySelectorAll(".folder.collapsed")) {
    folder.classList.remove("collapsed");
    folder.setAttribute("aria-expanded", "true");
  }
}

export function registerDocumentEnhancements() {
  for (const [hookName, collectionName] of DIRECTORY_CONTEXTS) {
    addDirectoryContext(hookName, collectionName);
  }

  for (const hookName of SHEET_HEADER_HOOKS) addSheetHeaderButton(hookName);
  for (const hookName of DIRECTORY_RENDER_HOOKS) Hooks.on(hookName, autoExpandFolders);
}
