const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    throw new Error(data.message || 'Request failed');
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
