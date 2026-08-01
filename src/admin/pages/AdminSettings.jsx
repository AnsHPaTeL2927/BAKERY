import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/adminApi';
import ImageUploader from '../components/ImageUploader';
import { TextField, TextAreaField } from '../components/FormField';

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);
  const [existingFavicon, setExistingFavicon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSettings()
      .then(({ settings }) => {
        if (settings) {
          setForm({ ...EMPTY_FORM, ...settings });
          setExistingLogo(settings.logo);
          setExistingFavicon(settings.favicon);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ''));
      if (logoFile) fd.append('logo', logoFile);
      if (faviconFile) fd.append('favicon', faviconFile);

      const { settings } = await updateSettings(fd);
      setForm({ ...EMPTY_FORM, ...settings });
      setExistingLogo(settings.logo);
      setExistingFavicon(settings.favicon);
      setLogoFile(null);
      setFaviconFile(null);
      setSuccess('Settings updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-cocoa-soft">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Site Configuration</p>
        <h1 className="font-display text-3xl font-semibold text-cocoa">Website Settings</h1>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-blush/70 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <ImageUploader label="Logo" hint="300x300" initialUrl={existingLogo} onChange={setLogoFile} />
        </div>
        <div>
          <ImageUploader label="Favicon" hint="64x64" initialUrl={existingFavicon} onChange={setFaviconFile} />
        </div>
        <TextField label="Site Name" required value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
        <TextField label="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        <TextAreaField
          label="Description"
          containerClassName="md:col-span-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <TextField
          label="WhatsApp Number"
          placeholder="e.g. 918780652597"
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        />
        <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <TextField
          label="Working Hours"
          containerClassName="md:col-span-2"
          value={form.hours}
          onChange={(e) => setForm({ ...form, hours: e.target.value })}
        />
        <TextField label="Instagram URL" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <TextField label="Facebook URL" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-cocoa py-3 font-semibold text-white disabled:opacity-60 md:col-span-2"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
