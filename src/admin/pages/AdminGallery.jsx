import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { galleryApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import ImageUploader from '../components/ImageUploader';
import { TextField, SelectField } from '../components/FormField';

const EMPTY_FORM = { alt: '', category: '', status: 'LIVE' };

export default function AdminGallery() {
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

  const pageSize = 12;

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
  }, [page, search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setExistingImage(null);
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({ alt: item.alt || '', category: item.category || '', status: item.status });
    setImageFile(null);
    setExistingImage(item.image);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Media</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Gallery</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 font-semibold text-white hover:bg-rose-deep"
        >
          <Plus className="h-4 w-4" /> New Image
        </button>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      <SearchInput value={search} onChange={setSearch} placeholder="Search by category or alt text…" />

      {search && <p className="text-xs text-cocoa-soft/70">Clear the search to drag and reorder images.</p>}

      <DataTable
        loading={loading}
        items={items}
        draggable={!search}
        onReorder={handleReorder}
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

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Gallery Image' : 'Edit Gallery Image'} onClose={() => setModal({ ...modal, open: false })}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUploader
            label="Image"
            hint="1200x1200"
            initialUrl={existingImage}
            required={modal.mode === 'create'}
            onChange={setImageFile}
          />
          <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <TextField label="Alt Text" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <button type="submit" disabled={saving} className="w-full rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Image'}
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
