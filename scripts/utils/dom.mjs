export function rootElement(value) {
  if (!value) return null;
  if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) return value;

  const candidates = [
    value[0],
    value.element?.[0],
    value.element,
    value
  ];

  return candidates.find((candidate) => candidate?.nodeType === 1) ?? null;
}

export function createElement(tag, { className = "", text = "", title = "", attributes = {} } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  if (title) node.title = title;

  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }

  return node;
}

export function t(key, fallback = key) {
  const localized = globalThis.game?.i18n?.localize?.(key);
  return localized && localized !== key ? localized : fallback;
}

export function tf(key, data = {}, fallback = key) {
  const localized = globalThis.game?.i18n?.format?.(key, data);
  if (localized && localized !== key) return localized;

  return Object.entries(data).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    fallback
  );
}

export async function copyText(value) {
  const text = String(value ?? "");
  if (!text) return false;

  try {
    if (globalThis.game?.clipboard?.copyPlainText) {
      await game.clipboard.copyPlainText(text);
      return true;
    }

    if (globalThis.navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function debounce(callback, wait = 80) {
  let timer;

  return (...args) => {
    globalThis.clearTimeout(timer);
    timer = globalThis.setTimeout(() => callback(...args), wait);
  };
}

export function appRoot(app, html) {
  const rendered = rootElement(app?.element) ?? rootElement(html);
  return rendered?.closest?.(".app, .application") ?? rendered;
}

export function safeDatasetId(value) {
  const node = rootElement(value);
  return node?.dataset?.documentId
    ?? node?.dataset?.entryId
    ?? node?.closest?.("[data-document-id], [data-entry-id]")?.dataset?.documentId
    ?? node?.closest?.("[data-document-id], [data-entry-id]")?.dataset?.entryId
    ?? "";
}
