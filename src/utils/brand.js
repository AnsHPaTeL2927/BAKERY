// Decides what to render for the site's brand mark in the Navbar/Footer —
// the uploaded logo image takes priority; falls back to the script-font site
// name text when no logo has been uploaded yet. Kept as a small pure
// function (no DOM/React) so the decision itself is unit-testable without
// needing to render a component.
const DEFAULT_SITE_NAME = 'Cakes by Tulsi';

export function resolveBrand(settings) {
  const siteName = settings?.siteName || DEFAULT_SITE_NAME;
  const logo = settings?.logo || null;
  if (logo) {
    return { type: 'image', src: logo, alt: siteName };
  }
  return { type: 'text', text: siteName };
}

export { DEFAULT_SITE_NAME };
