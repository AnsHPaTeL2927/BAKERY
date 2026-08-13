const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Validation failures come back as { message: 'Validation failed', details: { field: [msg, ...] } }
// (see server/middleware/validate.js) — the generic top-level message is useless on its own,
// so surface the actual field-level reasons whenever they're present.
function formatErrorMessage(data) {
  if (data && data.details && typeof data.details === 'object') {
    const messages = Object.values(data.details).flat().filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  return (data && data.message) || 'Request failed';
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(formatErrorMessage(data));
    error.status = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

export async function getPublicContent() {
  try {
    const [settings, categories, products, gallery, offers, testimonials, heroBanners] = await Promise.all([
      request('/settings').catch(() => ({})),
      request('/categories').catch(() => []),
      request('/products').catch(() => []),
      request('/gallery').catch(() => []),
      request('/offers').catch(() => []),
      request('/testimonials').catch(() => []),
      request('/hero-banners').catch(() => []),
    ]);

    return { settings, categories, products, gallery, offers, testimonials, heroBanners };
  } catch {
    return { settings: {}, categories: [], products: [], gallery: [], offers: [], testimonials: [], heroBanners: [] };
  }
}

// Lean single-endpoint fetch for callers that only need branding/settings
// (e.g. applying the favicon at boot) — avoids pulling the full public
// content bundle (products, gallery, offers, …) just for one field.
export async function getSiteSettings() {
  try {
    return await request('/settings');
  } catch {
    return {};
  }
}

export async function getGallery() {
  try {
    return await request('/gallery');
  } catch {
    return [];
  }
}

// Public review submission. The server forces every submission into the
// moderation queue, so a resolved promise means "received", never "published" —
// the UI must say so rather than implying the review is already live.
export async function submitReview({ name, rating, review }) {
  return request('/reviews', {
    method: 'POST',
    body: JSON.stringify({ name, rating, review }),
  });
}

export async function getTestimonials() {
  try {
    return await request('/testimonials');
  } catch {
    return [];
  }
}

export async function submitContactMessage(payload) {
  return request('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Fire-and-forget visitor/engagement tracking — never blocks or throws so it can
// never affect the visible behaviour of the public site.
export function trackEvent(type, refId) {
  request('/analytics/track', {
    method: 'POST',
    body: JSON.stringify(refId ? { type, refId } : { type }),
  }).catch(() => {});
}
