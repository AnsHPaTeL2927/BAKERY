const DEFAULT_NUMBER = "918780652597";
const WHATSAPP_WINDOW_NAME = "cakesByTulsiWhatsApp";
const PREF_KEY = "whatsapp_client_preference";
const TEMPLATE_KEY = "whatsapp_message_template";

export const DEFAULT_WHATSAPP_TEMPLATE = `Hello {{customer_name}},

Thank you for your order from {{business_name}}.

Invoice: {{invoice_number}}
Order: {{order_number}}
Cake/Product: {{product_name}}
Delivery/Pickup Date: {{delivery_date}}
Amount: {{amount}}
Payment Status: {{payment_status}}

Please let us know if you have any questions.

Thank you,
{{business_name}}`;

export const SUPPORTED_VARIABLES = [
  { token: "{{customer_name}}", label: "Customer Name" },
  { token: "{{invoice_number}}", label: "Invoice No." },
  { token: "{{order_number}}", label: "Order No." },
  { token: "{{product_name}}", label: "Product" },
  { token: "{{quantity}}", label: "Quantity" },
  { token: "{{weight}}", label: "Weight" },
  { token: "{{delivery_date}}", label: "Delivery Date" },
  { token: "{{delivery_time}}", label: "Delivery Time" },
  { token: "{{amount}}", label: "Amount" },
  { token: "{{payment_status}}", label: "Payment Status" },
  { token: "{{order_status}}", label: "Order Status" },
  { token: "{{business_name}}", label: "Business Name" },
];

export const SAMPLE_ORDER_DATA = {
  customerName: "Ansh",
  orderNumber: "ORD-0001",
  productName: "Choco Truffle Cake",
  quantity: 1,
  weight: "500g",
  pickupDatetime: "2026-08-05T00:00:00.000Z",
  totalAmount: 500,
  paymentStatus: "PENDING",
  status: "CONFIRMED",
};

// Returns admin's saved WhatsApp client preference ("auto", "desktop", or "web")
export function getWhatsAppPreference() {
  if (typeof localStorage === "undefined") return "auto";
  const val = localStorage.getItem(PREF_KEY);
  if (val === "desktop" || val === "web" || val === "auto") return val;
  return "auto";
}

// Saves WhatsApp client preference to localStorage
export function setWhatsAppPreference(pref) {
  if (typeof localStorage === "undefined") return;
  if (pref === "desktop" || pref === "web" || pref === "auto") {
    localStorage.setItem(PREF_KEY, pref);
  }
}

// Returns admin's saved WhatsApp message template
export function getWhatsAppTemplate() {
  if (typeof localStorage === "undefined") return DEFAULT_WHATSAPP_TEMPLATE;
  const val = localStorage.getItem(TEMPLATE_KEY);
  return val && val.trim() ? val : DEFAULT_WHATSAPP_TEMPLATE;
}

// Saves WhatsApp message template to localStorage
export function setWhatsAppTemplate(tpl) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TEMPLATE_KEY, tpl);
}

// Resets WhatsApp message template to default
export function resetWhatsAppTemplate() {
  if (typeof localStorage === "undefined") return DEFAULT_WHATSAPP_TEMPLATE;
  localStorage.removeItem(TEMPLATE_KEY);
  return DEFAULT_WHATSAPP_TEMPLATE;
}

// Replaces template variables with real order values
export function renderWhatsAppTemplate(template, order, settings = {}) {
  const tpl = template || getWhatsAppTemplate();
  const orderNo = order?.orderNumber || "";
  const invNumber = orderNo ? orderNo.replace("ORD-", "INV-") : "Invoice";
  const deliveryDateObj = order?.pickupDatetime ? new Date(order.pickupDatetime) : null;
  const dateStr = deliveryDateObj ? deliveryDateObj.toLocaleDateString(undefined, { dateStyle: "medium" }) : "";
  const timeStr = deliveryDateObj ? deliveryDateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";

  const replacements = {
    "{{customer_name}}": order?.customerName || "Customer",
    "{{invoice_number}}": invNumber,
    "{{order_number}}": orderNo,
    "{{product_name}}": order?.productName || "Bakery Order",
    "{{quantity}}": String(order?.quantity || 1),
    "{{weight}}": order?.weight || "",
    "{{delivery_date}}": dateStr,
    "{{delivery_time}}": timeStr,
    "{{amount}}": order?.totalAmount !== undefined ? `₹${Number(order.totalAmount).toFixed(2)}` : "",
    "{{payment_status}}": order?.paymentStatus ? (order.paymentStatus.charAt(0) + order.paymentStatus.slice(1).toLowerCase()) : "",
    "{{order_status}}": order?.status ? (order.status.charAt(0) + order.status.slice(1).toLowerCase()) : "",
    "{{business_name}}": settings?.siteName || "Cakes by Tulsi",
  };

  let result = tpl;
  Object.entries(replacements).forEach(([key, val]) => {
    result = result.replaceAll(key, val);
  });
  return result;
}

// Backwards-compatible alias for template rendering
export const buildInvoiceWhatsAppMessage = renderWhatsAppTemplate;

// Normalizes and validates customer phone numbers
export function normalizePhone(phone) {
  if (!phone || !String(phone).trim()) {
    return { valid: false, error: "Customer phone number is missing." };
  }
  const cleaned = String(phone).replace(/[\s\+\-\(\)]/g, "");
  if (/\D/.test(cleaned)) {
    return { valid: false, error: "Phone number contains invalid characters." };
  }
  let digits = cleaned;
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, error: "Please enter a valid phone number (10–15 digits)." };
  }
  return { valid: true, phone: digits };
}

// Ensures full absolute URL for invoice link
export function getFullInvoiceUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : window.location.origin;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Builds URLs for different WhatsApp launcher options
export function buildWhatsAppUrls(phoneDigits, message) {
  const text = encodeURIComponent(message);
  return {
    web: `https://web.whatsapp.com/send?phone=${phoneDigits}&text=${text}`,
    waMe: `https://wa.me/${phoneDigits}?text=${text}`,
    desktop: `whatsapp://send?phone=${phoneDigits}&text=${text}`,
    api: `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`,
  };
}

// Reusable WhatsApp opener respecting admin preference (desktop / web / auto)
export function openWhatsApp({ phone, message, preferredClient }) {
  const norm = normalizePhone(phone);
  if (!norm.valid) {
    throw new Error(norm.error);
  }

  const clientMode = preferredClient || getWhatsAppPreference();
  const urls = buildWhatsAppUrls(norm.phone, message);

  if (clientMode === "web") {
    const win = window.open(urls.web, "_blank");
    if (win) win.focus();
    return { success: true, mode: "web", url: urls.web };
  }

  if (clientMode === "desktop") {
    const win = window.open(urls.desktop, "_self");
    if (win) win.focus();
    return { success: true, mode: "desktop", url: urls.desktop };
  }

  // AUTO mode: Try desktop protocol first with fallback to Web if app cannot handle
  try {
    const win = window.open(urls.desktop, "_self");
    if (win) win.focus();
    return { success: true, mode: "auto", url: urls.desktop };
  } catch {
    const win = window.open(urls.api, "_blank");
    if (win) win.focus();
    return { success: true, mode: "auto-web", url: urls.api };
  }
}
