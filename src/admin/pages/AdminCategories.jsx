import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { categoriesApi } from '../services/adminApi';
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

const EMPTY_FORM = { name: '', slug: '', status: 'LIVE' };

export default function AdminCategories() {
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
      const data = await categoriesApi.list({ page, pageSize, search });
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
    setForm({ name: item.name, slug: item.slug, status: item.status });
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
        await categoriesApi.create(fd);
      } else {
        await categoriesApi.update(modal.id, fd);
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
      await categoriesApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await categoriesApi.setStatus(item.id, next);
    load();
  }

  async function handleReorder(reordered) {
    setItems(reordered);
    try {
      await categoriesApi.reorder(reordered.map((i) => i.id), (page - 1) * pageSize);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Menu Management</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Categories</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 font-semibold text-white hover:bg-rose-deep"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />

      {search && <p className="text-xs text-cocoa-soft/70">Clear the search to drag and reorder categories.</p>}

      <DataTable
        loading={loading}
        items={items}
        draggable={!search}
        onReorder={handleReorder}
        renderEmpty={
          <EmptyState
            icon={LayoutGrid}
            title="No categories yet"
            message="Create a category to start organising your menu."
            actionLabel="New Category"
            onAction={openCreate}
          />
        }
        columns={[
          { key: 'image', label: 'Image', render: (i) => <Thumbnail src={i.image} alt={i.name} /> },
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
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

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Category' : 'Edit Category'} onClose={() => setModal({ ...modal, open: false })}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <ImageUploader
            label="Category Image"
            dimensions="800 × 800 px"
            initialUrl={existingImage}
            required={modal.mode === 'create'}
            onChange={setImageFile}
          />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <button type="submit" disabled={saving} className="w-full rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60">
            {saving ? <ButtonLoader /> : 'Save Category'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Category"
        message="This will permanently delete this category. Products in it will become uncategorised."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
