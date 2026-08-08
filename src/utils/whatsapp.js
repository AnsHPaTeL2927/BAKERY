const DEFAULT_NUMBER = "918780652597";
const WHATSAPP_WINDOW_NAME = "cakesByTulsiWhatsApp";

// Builds a wa.me deep link that opens WhatsApp with a pre-filled message.
// Strips everything but digits, matching the existing waLinkFor() used for
// order reminders on the Dashboard.
export function waLink(message, number) {
  const digits = number ? number.replace(/\D/g, "") : DEFAULT_NUMBER;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// --- Tab reuse ---------------------------------------------------------
// Browsers give web pages no API to discover or attach to a WhatsApp Web tab
// the user opened independently (typed web.whatsapp.com themselves, or
// opened it earlier that day) — there is no "list open tabs" capability, by
// design, for privacy/security reasons. That is a hard browser boundary,
// not a gap in this code, and no client-side trick can cross it.
//
// What IS achievable: every call from this app reuses the same window.open()
// target name, so repeated clicks re-navigate the one popup THIS APP itself
// opened, instead of spawning a new tab on every click. This only works
// without the `noopener` flag — per spec, `noopener` forces a brand-new
// browsing context on every call, which would defeat reuse entirely. wa.me
// is a trusted first-party destination we control the link for, so skipping
// noopener here is an intentional, low-risk trade-off — not an oversight.
export function openWhatsApp(message, number) {
  const url = waLink(message, number);
  const win = window.open(url, WHATSAPP_WINDOW_NAME);
  if (win) win.focus();
  return win;
}

// --- Invoice delivery ----------------------------------------------------
// wa.me / WhatsApp Web expose no URL parameter for pre-attaching a file —
// only a pre-filled *text* message. There is no browser-side workaround for
// that; it's a WhatsApp Web platform limitation this app cannot patch
// around. The best available UX today: open the chat with a message that
// already contains the invoice link (so the customer can tap it immediately)
// while the admin uses the Download button to grab the PDF and attach it
// manually if they also want to send the file itself.
//
// Upgrade path: once this project has WhatsApp Business Cloud API
// credentials, replace this function's body with a server-side call to
// POST /v1/messages using a `document` message type pointing at the
// invoice's public URL — the PDF would then arrive as a real WhatsApp
// attachment automatically, with no manual step. Every call site in this
// app already goes through this one function, so that upgrade only needs
// to happen in this one place.
export function sendInvoiceViaWhatsApp({ customerName, phone, invoiceUrl }) {
  const message = [
    `Hello ${customerName},`,
    "",
    "Thank you for your order.",
    "Your invoice is ready.",
    "",
    "Invoice:",
    invoiceUrl,
    "",
    "Regards,",
    "Cakes by Tulsi",
  ].join("\n");
  return openWhatsApp(message, phone);
}
