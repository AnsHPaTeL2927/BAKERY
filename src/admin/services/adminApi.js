const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_BASE_URL = `${API_BASE_URL}/admin`;

let refreshPromise = null;

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

async function rawRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.otpSessionToken) {
    headers['x-otp-session-token'] = options.otpSessionToken;
  }
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${ADMIN_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST' }).finally(() => {
      refreshPromise = null;
    });
  }
  const { response } = await refreshPromise;
  return response.ok;
}

// Every admin call goes through here so a single 401 (expired access token) is
// resolved transparently by rotating the refresh token once, then retrying.
async function request(path, options = {}) {
  let { response, data } = await rawRequest(path, options);

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ response, data } = await rawRequest(path, options));
    }
  }

  if (!response.ok) {
    const error = new Error(formatErrorMessage(data));
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

// ---- Auth ----
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const verifyOtp = (otp, otpSessionToken) =>
  request('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ otp, otpSessionToken }),
    otpSessionToken,
  });

export const resendOtp = (otpSessionToken) =>
  request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ otpSessionToken }), otpSessionToken });

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPassword = ({ email, code, newPassword }) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) });

export const getMe = () => request('/auth/me');

export const logout = () => request('/auth/logout', { method: 'POST' });

// ---- Dashboard ----
export const getDashboard = () => request('/dashboard');

// ---- Generic CRUD resource factory ----
function buildListQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function createResource(resourcePath) {
  return {
    list: (params) => request(`${resourcePath}${buildListQuery(params)}`),
    create: (formData) => request(resourcePath, { method: 'POST', body: formData }),
    update: (id, formData) => request(`${resourcePath}/${id}`, { method: 'PUT', body: formData }),
    remove: (id) => request(`${resourcePath}/${id}`, { method: 'DELETE' }),
    setStatus: (id, status) =>
      request(`${resourcePath}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    reorder: (order, offset = 0) =>
      request(`${resourcePath}/reorder`, { method: 'PATCH', body: JSON.stringify({ order, offset }) }),
  };
}

export const categoriesApi = createResource('/categories');
export const productsApi = createResource('/products');
export const galleryApi = createResource('/gallery');
export const bannersApi = createResource('/banners');
export const offersApi = createResource('/offers');
// Testimonials additionally carry a moderation step, because visitors can now
// submit reviews themselves from the public site — approving publishes the row
// (approved + LIVE) in one call, rejecting only clears the approved flag.
export const testimonialsApi = {
  ...createResource('/testimonials'),
  setApproval: (id, approved) =>
    request(`/testimonials/${id}/approval`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
};

// ---- Settings (singleton) ----
export const getSettings = () => request('/settings');
export const updateSettings = (formData) => request('/settings', { method: 'PUT', body: formData });

// ---- Contact messages (list + status only — no create/delete endpoints exist) ----
export const messagesApi = {
  list: (params) => request(`/messages${buildListQuery(params)}`),
  updateStatus: (id, status) =>
    request(`/messages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ---- Orders (plain JSON bodies — no image uploads, so the generic FormData-based factory doesn't fit) ----
export const ordersApi = {
  list: (params) => request(`/orders${buildListQuery(params)}`),
  create: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updatePaymentStatus: (id, payload) => request(`/orders/${id}/payment-status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  generateInvoice: (id) => request(`/orders/${id}/invoice`, { method: 'POST' }),
  getTimeline: (id) => request(`/orders/${id}/timeline`),
};
