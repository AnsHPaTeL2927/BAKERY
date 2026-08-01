const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_BASE_URL = `${API_BASE_URL}/admin`;

let refreshPromise = null;

async function rawRequest(path, options) {
  const headers = { ...(options.headers || {}) };
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
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

// ---- Auth ----
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const verifyOtp = (otp) => request('/auth/verify', { method: 'POST', body: JSON.stringify({ otp }) });

export const resendOtp = () => request('/auth/resend-otp', { method: 'POST' });

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
export const testimonialsApi = createResource('/testimonials');

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
  remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
};
