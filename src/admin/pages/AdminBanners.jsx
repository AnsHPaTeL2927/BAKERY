import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { bannersApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
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
import heroDefault from '../../assets/hero-default.svg';

const EMPTY_FORM = { title: '', subtitle: '', ctaText: '', ctaLink: '', status: 'LIVE' };

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    try {
      const data = await bannersApi.list({ page, pageSize, search });
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
    setImageFile(null);
    setExistingImage(null);
    setError('');
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({
      title: item.title || '',
      subtitle: item.subtitle || '',
      ctaText: item.ctaText || '',
      ctaLink: item.ctaLink || '',
      status: item.status,
    });
    setImageFile(null);
    setExistingImage(item.image);
    setError('');
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      if (imageFile) fd.append('image', imageFile);

      if (modal.mode === 'create') {
        await bannersApi.create(fd);
      } else {
        await bannersApi.update(modal.id, fd);
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
      await bannersApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await bannersApi.setStatus(item.id, next);
    load();
  }

  async function handleReorder(reordered) {
    setItems(reordered);
    try {
      await bannersApi.reorder(reordered.map((i) => i.id), (page - 1) * pageSize);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Home Page</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Hero Banners</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 font-semibold text-white hover:bg-rose-deep"
        >
          <Plus className="h-4 w-4" /> New Banner
        </button>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      <SearchInput value={search} onChange={setSearch} placeholder="Search banners…" />

      {search && <p className="text-xs text-cocoa-soft/70">Clear the search to drag and reorder banners.</p>}

      {!loading && !search && items.length === 0 && (
        <div className="flex flex-col gap-4 rounded-3xl border border-blush/70 bg-white p-5 sm:flex-row sm:items-center">
          <img src={heroDefault} alt="Default hero banner preview" className="h-32 w-full rounded-2xl object-cover sm:w-56" />
          <div>
            <p className="font-display font-semibold text-cocoa">No custom banner yet</p>
            <p className="mt-1 text-sm text-cocoa-soft/80">
              Your homepage is currently showing this built-in default hero image. Upload a banner below to replace it.
            </p>
          </div>
        </div>
      )}

      <DataTable
        loading={loading}
        items={items}
        draggable={!search}
        onReorder={handleReorder}
        renderEmpty={
          <EmptyState
            icon={ImageIcon}
            title="No hero banners yet"
            message="Upload a banner image to feature it on your homepage."
            actionLabel="New Banner"
            onAction={openCreate}
          />
        }
        columns={[
          { key: 'image', label: 'Image', render: (i) => <Thumbnail src={i.image} alt={i.title} /> },
          { key: 'title', label: 'Title' },
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

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Hero Banner' : 'Edit Hero Banner'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <ImageUploader
              label="Banner Image"
              dimensions="1920 × 800 px"
              initialUrl={existingImage}
              required={modal.mode === 'create'}
              onChange={setImageFile}
            />
          </div>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <TextField label="CTA Text" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
          <TextField label="CTA Link" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <button type="submit" disabled={saving} className="rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60 md:col-span-2">
            {saving ? <ButtonLoader /> : 'Save Banner'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Banner"
        message="This will permanently delete this hero banner."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
