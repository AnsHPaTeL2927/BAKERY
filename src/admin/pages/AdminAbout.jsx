import { useEffect, useState } from 'react';
import { Save, UserRound, Images } from 'lucide-react';
import { getAbout, updateAbout } from '../services/adminApi';
import ImageUploader from '../components/ImageUploader';
import { TextField, TextAreaField } from '../components/FormField';
import ButtonLoader from '../../components/loading/ButtonLoader';
import { useToast } from '../components/ToastProvider';

const EMPTY_FORM = {
  chefHeading: '',
  chefName: '',
  chefBio: '',
  image1Alt: '',
  image2Alt: '',
  image3Alt: '',
};

// The four uploads on this page, in render order. Kept as data so the image
// state (file / existing URL / pending removal) is handled once rather than
// four times over.
const KITCHEN_IMAGES = [
  { field: 'image1', altField: 'image1Alt', label: 'Kitchen Photo 1' },
  { field: 'image2', altField: 'image2Alt', label: 'Kitchen Photo 2' },
  { field: 'image3', altField: 'image3Alt', label: 'Kitchen Photo 3' },
];

const IMAGE_FIELDS = ['chefPhoto', ...KITCHEN_IMAGES.map((img) => img.field)];

export default function AdminAbout() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState({});
  const [existing, setExisting] = useState({});
  const [removals, setRemovals] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  function applyRecord(about) {
    setForm({ ...EMPTY_FORM, ...Object.fromEntries(Object.entries(about || {}).filter(([, v]) => v !== null)) });
    setExisting(Object.fromEntries(IMAGE_FIELDS.map((field) => [field, about?.[field] || null])));
    setFiles({});
    setRemovals({});
  }

  useEffect(() => {
    getAbout()
      .then(({ about }) => applyRecord(about))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(field, file) {
    setFiles((prev) => ({ ...prev, [field]: file }));
    setRemovals((prev) => ({ ...prev, [field]: false }));
  }

  function handleImageRemove(field) {
    setFiles((prev) => ({ ...prev, [field]: null }));
    setExisting((prev) => ({ ...prev, [field]: null }));
    setRemovals((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ''));

      for (const field of IMAGE_FIELDS) {
        if (files[field]) fd.append(field, files[field]);
        else if (removals[field]) fd.append(`remove_${field}`, 'true');
      }

      const { about } = await updateAbout(fd);
      applyRecord(about);
      showToast('About page updated.', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Could not save the About page.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-64 rounded-admin bg-admin-card border border-admin-border animate-pulse" />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-admin-text">About Page</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-admin-muted">
          Controls the baker introduction and the “Inside Our Kitchen” photos on the public About page.
          Anything left blank keeps the site’s built-in default.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-admin-danger/30 bg-admin-danger/5 px-4 py-3 text-sm text-admin-danger">
          {error}
        </div>
      )}

      <section className="bg-admin-card border border-admin-border rounded-admin p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserRound size={18} className="text-admin-primary" />
          <h2 className="font-semibold text-admin-text">Meet the Baker</h2>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-5">
          <ImageUploader
            label="Chef Photo"
            dimensions="800 × 600px (4:3), JPG or PNG"
            initialUrl={existing.chefPhoto}
            onChange={(file) => handleImageChange('chefPhoto', file)}
            onRemove={() => handleImageRemove('chefPhoto')}
          />

          <div className="space-y-4">
            <TextField
              label="Heading"
              description="Small script line above the name — e.g. “Meet the Baker”."
              value={form.chefHeading}
              onChange={(e) => updateField('chefHeading', e.target.value)}
            />
            <TextField
              label="Chef Name"
              description="Shown as the section title, e.g. “Tulsi”."
              value={form.chefName}
              onChange={(e) => updateField('chefName', e.target.value)}
            />
            <TextAreaField
              label="Description"
              description="The baker’s story. Leave a blank line between paragraphs to split them on the page."
              rows={8}
              value={form.chefBio}
              onChange={(e) => updateField('chefBio', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="bg-admin-card border border-admin-border rounded-admin p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Images size={18} className="text-admin-primary" />
          <h2 className="font-semibold text-admin-text">Inside Our Kitchen</h2>
        </div>
        <p className="text-xs sm:text-sm text-admin-muted mb-4">
          Three square photos shown in a row beneath the baker introduction.
        </p>

        <div className="grid sm:grid-cols-3 gap-5">
          {KITCHEN_IMAGES.map(({ field, altField, label }) => (
            <div key={field} className="space-y-3">
              <ImageUploader
                label={label}
                dimensions="600 × 600px (square), JPG or PNG"
                initialUrl={existing[field]}
                onChange={(file) => handleImageChange(field, file)}
                onRemove={() => handleImageRemove(field)}
              />
              <TextField
                label="Alt Text"
                description="Describes the photo for screen readers and search engines."
                value={form[altField]}
                onChange={(e) => updateField(altField, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-admin-primary hover:bg-admin-primary-hover disabled:opacity-60 text-white px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {saving ? (
            <ButtonLoader />
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
