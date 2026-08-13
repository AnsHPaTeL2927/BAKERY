import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Images, Eye, EyeOff, ChevronUp, ChevronDown, ArrowUpDown, Check } from 'lucide-react';
import { galleryApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
import CardListItem from '../components/CardListItem';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import ImageUploader from '../components/ImageUploader';
import EmptyState from '../components/EmptyState';
import ButtonLoader from '../../components/loading/ButtonLoader';
import { TextField, SelectField } from '../components/FormField';
import useIsMobile from '../hooks/useIsMobile';

const EMPTY_FORM = { alt: '', category: '', status: 'LIVE' };

export default function AdminGallery() {
  const isMobile = useIsMobile();
  const [reorderMode, setReorderMode] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [pageSize, setPageSize] = useState(12);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validateForm() {
    const errs = {};
    if (form.alt && form.alt.length > 200) errs.alt = 'Alt text must be 200 characters or fewer';
    if (form.category && form.category.length > 100) errs.category = 'Category must be 100 characters or fewer';
    if (modal.mode === 'create' && !imageFile) errs.image = 'An image is required';
    return errs;
  }

  async function load() {
    setLoading(true);
    try {
      const data = await galleryApi.list({ page, pageSize, search });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  function handlePageSizeChange(size) {
    setPageSize(size);
    setPage(1);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setImageFile(null);
    setExistingImage(null);
    setError('');
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({ alt: item.alt || '', category: item.category || '', status: item.status });
    setFormErrors({});
    setImageFile(null);
    setExistingImage(item.image);
    setError('');
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    setError('');
    setFormErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      if (imageFile) fd.append('image', imageFile);

      if (modal.mode === 'create') {
        await galleryApi.create(fd);
      } else {
        await galleryApi.update(modal.id, fd);
      }
      setModal({ open: false, mode: 'create', id: null });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await galleryApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await galleryApi.setStatus(item.id, next);
    load();
  }

  async function handleReorder(reordered) {
    setItems(reordered);
    try {
      await galleryApi.reorder(reordered.map((i) => i.id), (page - 1) * pageSize);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    handleReorder(reordered);
  }

  function renderGalleryCard(item, index) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.image}
        icon={Images}
        title={item.category || 'Uncategorised'}
        subtitle={item.alt || '—'}
        badge={<StatusBadge status={item.status} />}
        primaryActions={
          reorderMode && !search
            ? [
                { icon: ChevronUp, label: 'Move Up', onClick: () => moveItem(index, -1) },
                { icon: ChevronDown, label: 'Move Down', onClick: () => moveItem(index, 1) },
              ]
            : []
        }
        actions={[
          {
            icon: item.status === 'LIVE' ? EyeOff : Eye,
            label: item.status === 'LIVE' ? 'Hide' : 'Publish',
            onClick: () => handleStatusToggle(item),
          },
          { icon: Pencil, label: 'Edit', onClick: () => openEdit(item) },
          { icon: Trash2, label: 'Delete', onClick: () => setConfirmDelete(item.id), danger: true },
        ]}
        onClick={() => openEdit(item)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Media</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Gallery</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {!search && (
            <button
              type="button"
              onClick={() => setReorderMode((v) => !v)}
              className={`flex h-11 items-center gap-1.5 rounded-2xl border px-3.5 text-sm font-semibold transition-colors sm:hidden ${
                reorderMode
                  ? 'border-admin-primary bg-admin-primary text-white'
                  : 'border-admin-border bg-admin-card text-admin-text hover:bg-admin-bg'
              }`}
            >
              <ArrowUpDown className="h-4 w-4" /> {reorderMode ? 'Done' : 'Reorder'}
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-admin-primary px-5 py-2.5 font-semibold text-white hover:bg-admin-primary-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Image
          </button>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      {isMobile && reorderMode ? (
        <>
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose/8 p-3">
            <ArrowUpDown className="mt-0.5 h-4 w-4 shrink-0 text-rose-deep" />
            <p className="text-xs leading-relaxed text-rose-deep">
              Use the arrows to reposition a photo. Photo 1 shows first on the website — changes save as you go.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2">
            {items.map((item, index) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-admin border border-blush/70 bg-blush-soft">
                <img src={item.image} alt={item.alt || ''} className="h-full w-full object-cover" />
                <span className="absolute top-2.5 left-2.5 flex h-6.5 w-6.5 items-center justify-center rounded-full bg-rose text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-cocoa disabled:opacity-30"
                    aria-label="Move earlier"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-cocoa disabled:opacity-30"
                    aria-label="Move later"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                {(item.alt || item.category) && (
                  <span className="absolute right-0 bottom-0 left-0 truncate bg-white/85 px-2.5 py-1.5 text-[11px] font-semibold text-cocoa-soft">
                    {item.alt || item.category}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-20 z-10 flex gap-3 rounded-2xl border border-blush/70 bg-white p-3 shadow-lg">
            <button
              type="button"
              onClick={() => setReorderMode(false)}
              className="flex-1 rounded-2xl border border-blush py-3 text-sm font-bold text-cocoa"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setReorderMode(false)}
              className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-rose py-3 text-sm font-bold text-white"
            >
              <Check className="h-4 w-4" /> Done
            </button>
          </div>
        </>
      ) : (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by category or alt text…" />

          {search && <p className="text-xs text-cocoa-soft/70">Clear the search to drag and reorder images.</p>}

          <DataTable
            loading={loading}
            items={items}
            draggable={!search}
            onReorder={handleReorder}
            renderCard={renderGalleryCard}
            renderEmpty={
              <EmptyState
                icon={Images}
                title="No gallery images yet"
                message="Upload photos of your bakes to showcase in the gallery."
                actionLabel="New Image"
                onAction={openCreate}
              />
            }
            columns={[
              { key: 'image', label: 'Image', render: (i) => <Thumbnail src={i.image} alt={i.alt} /> },
              { key: 'category', label: 'Category' },
              { key: 'alt', label: 'Alt Text' },
              { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
            ]}
            renderActions={(item) => (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusToggle(item)}
                  className="rounded-full border border-blush px-3 py-1 text-xs font-semibold text-cocoa hover:bg-blush-soft"
                >
                  {item.status === 'LIVE' ? 'Hide' : 'Publish'}
                </button>
                <button type="button" onClick={() => openEdit(item)} className="rounded-full border border-blush p-1.5 text-cocoa hover:bg-blush-soft">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(item.id)}
                  className="rounded-full border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          />

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
        </>
      )}

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Gallery Image' : 'Edit Gallery Image'} onClose={() => setModal({ ...modal, open: false })}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <ImageUploader
            label="Image"
            dimensions="1200 × 1200 px"
            initialUrl={existingImage}
            required={modal.mode === 'create'}
            onChange={(file) => {
              setImageFile(file);
              if (formErrors.image) setFormErrors((prev) => ({ ...prev, image: null }));
            }}
          />
          {formErrors.image && <p className="-mt-2 text-[11px] font-semibold text-rose-600">{formErrors.image}</p>}
          <TextField label="Category" value={form.category} error={formErrors.category} onChange={(e) => updateField('category', e.target.value)} />
          <TextField label="Alt Text" value={form.alt} error={formErrors.alt} onChange={(e) => updateField('alt', e.target.value)} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <button type="submit" disabled={saving} className="w-full rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60">
            {saving ? <ButtonLoader /> : 'Save Image'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Gallery Image"
        message="This will permanently remove this image from the gallery."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
