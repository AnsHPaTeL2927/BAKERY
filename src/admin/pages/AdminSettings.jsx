import { useEffect, useRef, useState } from 'react';
import { MessageCircle, RotateCcw, Save, Sparkles, Globe } from 'lucide-react';
import { getSettings, updateSettings } from '../services/adminApi';
import { applyFavicon } from '../../utils/favicon';
import ImageUploader from '../components/ImageUploader';
import { TextField, TextAreaField } from '../components/FormField';
import ButtonLoader from '../../components/loading/ButtonLoader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  getWhatsAppPreference,
  setWhatsAppPreference,
  getWhatsAppTemplate,
  setWhatsAppTemplate,
  resetWhatsAppTemplate,
  renderWhatsAppTemplate,
  SUPPORTED_VARIABLES,
  SAMPLE_ORDER_DATA,
  openWhatsApp,
} from '../../utils/whatsapp';
import { useToast } from '../components/ToastProvider';

const EMPTY_FORM = {
  siteName: '',
  tagline: '',
  description: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  hours: '',
  instagram: '',
  facebook: '',
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);
  const [existingFavicon, setExistingFavicon] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [whatsappPref, setWhatsappPref] = useState(getWhatsAppPreference);
  const [whatsappTemplate, setWhatsappTemplateState] = useState(getWhatsAppTemplate);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const textareaRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    getSettings()
      .then(({ settings }) => {
        if (settings) {
          setForm({ ...EMPTY_FORM, ...settings });
          setExistingLogo(settings.logo);
          setExistingFavicon(settings.favicon);
          setRemoveLogo(false);
          setRemoveFavicon(false);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validateForm() {
    const errs = {};
    const siteName = form.siteName?.trim() || '';
    if (siteName.length < 2 || siteName.length > 150) errs.siteName = 'Site name must be between 2 and 150 characters';
    if (form.whatsapp?.trim() && !/^\d{10,15}$/.test(form.whatsapp.trim())) {
      errs.whatsapp = 'Use digits only, with country code (10–15 digits)';
    }
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    if (form.instagram?.trim() && !/^https?:\/\/.+/.test(form.instagram.trim())) {
      errs.instagram = 'Enter a full URL, e.g. https://instagram.com/yourpage';
    }
    if (form.facebook?.trim() && !/^https?:\/\/.+/.test(form.facebook.trim())) {
      errs.facebook = 'Enter a full URL, e.g. https://facebook.com/yourpage';
    }
    return errs;
  }

  function handleWhatsAppPrefChange(newPref) {
    setWhatsappPref(newPref);
    setWhatsAppPreference(newPref);
    showToast(`WhatsApp mode set to ${newPref.toUpperCase()}`, 'success');
  }

  function handleInsertVariable(token) {
    const el = textareaRef.current;
    if (!el) {
      setWhatsappTemplateState((prev) => prev + ` ${token}`);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = whatsappTemplate;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + token + after;
    setWhatsappTemplateState(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  }

  function handleSaveWhatsAppSettings() {
    setWhatsAppPreference(whatsappPref);
    setWhatsAppTemplate(whatsappTemplate);
    showToast('WhatsApp configuration saved successfully.', 'success');
  }

  function handleConfirmResetTemplate() {
    const defTpl = resetWhatsAppTemplate();
    setWhatsappTemplateState(defTpl);
    setShowResetConfirm(false);
    showToast('WhatsApp template restored to default.', 'success');
  }

  function handleTestWhatsApp() {
    try {
      const sampleMsg = renderWhatsAppTemplate(whatsappTemplate, SAMPLE_ORDER_DATA, form);
      openWhatsApp({
        phone: form.whatsapp || '918780652597',
        message: sampleMsg,
        preferredClient: whatsappPref,
      });
      showToast(`Test WhatsApp opened (${whatsappPref.toUpperCase()} mode)`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setError('Please fix the highlighted fields.');
      setSuccess('');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    setFormErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ''));
      if (logoFile) fd.append('logo', logoFile);
      else if (removeLogo) fd.append('removeLogo', 'true');
      if (faviconFile) fd.append('favicon', faviconFile);
      else if (removeFavicon) fd.append('removeFavicon', 'true');

      const { settings } = await updateSettings(fd);
      setForm({ ...EMPTY_FORM, ...settings });
      setExistingLogo(settings.logo);
      setExistingFavicon(settings.favicon);
      setLogoFile(null);
      setFaviconFile(null);
      setRemoveLogo(false);
      setRemoveFavicon(false);
      // Reflect the new favicon in the browser tab immediately — no reload needed.
      applyFavicon(settings.favicon, settings.updatedAt);

      setSuccess('Settings updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-admin-muted">Loading…</p>;

  const livePreviewText = renderWhatsAppTemplate(whatsappTemplate, SAMPLE_ORDER_DATA, form);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-admin-primary">Site Configuration</p>
        <h1 className="font-display text-3xl font-semibold text-admin-text">Website Settings</h1>
      </div>

      {/* Sub-section Navigation Tabs — full-width two-segment control below sm:,
          the original inline button pair unchanged at sm: and up. */}
      <div className="grid grid-cols-2 gap-2 border-b border-admin-border pb-3 sm:flex sm:items-center">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:justify-start ${
            activeTab === 'general'
              ? 'bg-admin-primary text-white shadow-sm'
              : 'text-admin-muted hover:text-admin-text hover:bg-admin-bg'
          }`}
        >
          <Globe className="h-4 w-4" /> General Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:justify-start ${
            activeTab === 'whatsapp'
              ? 'bg-admin-primary text-white shadow-sm'
              : 'text-admin-muted hover:text-admin-text hover:bg-admin-bg'
          }`}
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Settings
        </button>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

      {/* ═══ SUB-SECTION 1: GENERAL SETTINGS ═══ */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-admin-border bg-admin-card p-6 shadow-sm md:grid-cols-2">
          <div>
            <ImageUploader
              label="Logo"
              hint="300x300"
              initialUrl={existingLogo}
              onChange={(file) => {
                setLogoFile(file);
                setRemoveLogo(false);
              }}
              onRemove={() => {
                setLogoFile(null);
                setExistingLogo(null);
                setRemoveLogo(true);
              }}
            />
          </div>
          <div>
            <ImageUploader
              label="Favicon"
              hint="64x64"
              initialUrl={existingFavicon}
              onChange={(file) => {
                setFaviconFile(file);
                setRemoveFavicon(false);
              }}
              onRemove={() => {
                setFaviconFile(null);
                setExistingFavicon(null);
                setRemoveFavicon(true);
              }}
            />
          </div>
          <TextField label="Site Name" required description="Brand title displayed on site shell, invoices, and tab title." value={form.siteName} error={formErrors.siteName} onChange={(e) => updateField('siteName', e.target.value)} />
          <TextField label="Tagline" description="Brand tagline (e.g. Handcrafted Luxury Home Bakery)." value={form.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
          <TextAreaField
            label="Description"
            description="Site meta summary used for SEO and brand presentation."
            containerClassName="md:col-span-2"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <TextField label="Phone" description="Store phone number for customer contact." value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          <TextField
            label="WhatsApp Number"
            description="WhatsApp number for order notifications (digits with country code)."
            placeholder="e.g. 918780652597"
            value={form.whatsapp}
            error={formErrors.whatsapp}
            onChange={(e) => updateField('whatsapp', e.target.value)}
          />
          <TextField label="Email" type="email" description="Official email address for customer inquiry emails." value={form.email} error={formErrors.email} onChange={(e) => updateField('email', e.target.value)} />
          <TextField label="Address" description="Bakery kitchen/pickup shop address displayed on site footer & invoices." value={form.address} onChange={(e) => updateField('address', e.target.value)} />
          <TextField
            label="Working Hours"
            description="Store operating days and pickup timings."
            containerClassName="md:col-span-2"
            value={form.hours}
            onChange={(e) => updateField('hours', e.target.value)}
          />
          <TextField label="Instagram URL" description="Link to Instagram page." placeholder="https://instagram.com/yourpage" value={form.instagram} error={formErrors.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
          <TextField label="Facebook URL" description="Link to Facebook page." placeholder="https://facebook.com/yourpage" value={form.facebook} error={formErrors.facebook} onChange={(e) => updateField('facebook', e.target.value)} />
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-admin-primary py-3 font-semibold text-white hover:bg-admin-primary-hover disabled:opacity-60 md:col-span-2 transition-colors"
          >
            {saving ? <ButtonLoader /> : 'Save General Settings'}
          </button>
        </form>
      )}

      {/* ═══ SUB-SECTION 2: WHATSAPP SETTINGS ═══ */}
      {activeTab === 'whatsapp' && (
        <div className="rounded-3xl border border-admin-border bg-admin-card p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-admin-primary" />
              <h2 className="font-display text-xl font-semibold text-admin-text">WhatsApp Settings</h2>
            </div>
            <p className="text-sm text-admin-muted mt-1">Configure default client opening mode and customize invoice messages.</p>
          </div>

          {/* 1. Client Mode Preference */}
          <div>
            <span className="mb-1.5 block font-semibold text-sm text-admin-text">WhatsApp Client Preference</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: 'auto', title: 'Auto (Recommended)', desc: 'Tries WhatsApp Desktop app first, falls back to Web if unavailable.' },
                { id: 'desktop', title: 'WhatsApp Desktop', desc: 'Directly launches native WhatsApp Desktop application (whatsapp:// protocol).' },
                { id: 'web', title: 'WhatsApp Web', desc: 'Opens WhatsApp Web directly in a new browser tab (web.whatsapp.com).' },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                    whatsappPref === item.id
                      ? 'border-admin-primary bg-admin-primary/5 ring-2 ring-admin-primary/20'
                      : 'border-admin-border hover:bg-admin-bg'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      type="radio"
                      name="whatsappPref"
                      value={item.id}
                      checked={whatsappPref === item.id}
                      onChange={(e) => handleWhatsAppPrefChange(e.target.value)}
                      className="text-admin-primary focus:ring-admin-primary"
                    />
                    <span className="font-semibold text-sm text-admin-text">{item.title}</span>
                  </div>
                  <p className="text-xs text-admin-muted leading-relaxed">{item.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Message Template Editor */}
          <div className="space-y-2 pt-2 border-t border-admin-border/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-admin-text">Message Template</span>
              <span className="text-xs text-admin-muted">Click a variable below to insert it at cursor position</span>
            </div>

            {/* Variable Insertion Pills */}
            <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-admin-bg border border-admin-border/60">
              {SUPPORTED_VARIABLES.map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => handleInsertVariable(item.token)}
                  className="rounded-xl border border-admin-border bg-admin-card px-2.5 py-1 text-xs font-semibold text-admin-text hover:border-admin-primary hover:text-admin-primary transition-all shadow-xs"
                  title={`Insert ${item.token}`}
                >
                  + {item.label}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              rows={8}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplateState(e.target.value)}
              className="w-full rounded-2xl border border-admin-border bg-admin-card p-3.5 text-sm text-admin-text focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 font-mono"
              placeholder="Type your WhatsApp invoice template…"
            />
          </div>

          {/* 3. Live WhatsApp Message Preview */}
          <div className="space-y-1.5 pt-2 border-t border-admin-border/60">
            <span className="font-semibold text-xs uppercase tracking-wider text-admin-muted flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-admin-primary" /> Live WhatsApp Message Preview
            </span>
            <div className="rounded-2xl border border-admin-border bg-emerald-50/50 p-4 font-mono text-xs text-cocoa leading-relaxed whitespace-pre-wrap">
              {livePreviewText}
            </div>
          </div>

          {/* Action Controls */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-admin-border/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-admin-border px-3.5 py-2 text-xs font-semibold text-admin-muted hover:text-admin-danger hover:bg-admin-danger/10 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to Default
              </button>
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="flex items-center gap-1.5 rounded-xl border border-admin-border px-3.5 py-2 text-xs font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-admin-success" /> Test WhatsApp
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveWhatsAppSettings}
              className="flex items-center gap-2 rounded-xl bg-admin-primary px-5 py-2 text-sm font-semibold text-white hover:bg-admin-primary-hover transition-colors shadow-sm"
            >
              <Save className="h-4 w-4" /> Save WhatsApp Settings
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset WhatsApp Template"
        message="Are you sure you want to reset the WhatsApp message template to default? This will overwrite your current custom message template."
        onConfirm={handleConfirmResetTemplate}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
