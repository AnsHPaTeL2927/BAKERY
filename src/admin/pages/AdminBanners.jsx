import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, Eye, EyeOff, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { bannersApi } from '../services/adminApi';
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
import heroDefault from '../../assets/hero-default.svg';

const EMPTY_FORM = { title: '', subtitle: '', ctaText: '', ctaLink: '', status: 'LIVE' };

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reorderMode, setReorderMode] = useState(false);

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

  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    handleReorder(reordered);
  }

  function renderBannerCard(item, index) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.image}
        icon={ImageIcon}
        title={item.title || 'Untitled Banner'}
        subtitle={item.subtitle || '—'}
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
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Home Page</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Hero Banners</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {!search && items.length > 1 && (
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
            <Plus className="h-4 w-4" /> New Banner
          </button>
        </div>
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
        renderCard={renderBannerCard}
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
