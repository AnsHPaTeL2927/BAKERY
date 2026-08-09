// Applies the site's configured favicon to the running document — this is a
// single-page app (public site + /admin share one document), so the tab icon
// only needs to be set once at boot and again whenever Settings saves a new one.
const DEFAULT_FAVICON = "/favicon.svg";

function faviconMimeType(url) {
  if (/\.svg(\?|$)/i.test(url)) return "image/svg+xml";
  if (/\.png(\?|$)/i.test(url)) return "image/png";
  if (/\.ico(\?|$)/i.test(url)) return "image/x-icon";
  return "image/webp"; // uploaded favicons are processed to webp by the backend
}

function setFaviconLink(href, { allowFallback } = {}) {
  // Chrome/Edge sometimes keep showing the old icon if you just mutate an
  // existing <link>'s href, so the element is replaced outright instead —
  // that reliably forces a refetch and repaint of the tab icon.
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = faviconMimeType(href);
  link.href = href;
  if (allowFallback) {
    link.onerror = () => setFaviconLink(DEFAULT_FAVICON);
  }
  document.head.appendChild(link);
}

/**
 * Point the browser tab icon at the given favicon URL, falling back to the
 * app default when none is configured or the configured one fails to load.
 *
 * @param {string|null|undefined} url - Absolute favicon URL from WebsiteSettings.
 * @param {string|number|null} [version] - A stable value (e.g. settings.updatedAt)
 *   appended as a cache-busting query param. Only pass something that changes
 *   when the favicon actually changes — never a random/per-render value.
 */
export function applyFavicon(url, version) {
  if (!url) {
    setFaviconLink(DEFAULT_FAVICON);
    return;
  }
  const href = version ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}` : url;
  setFaviconLink(href, { allowFallback: true });
}

export { DEFAULT_FAVICON };
