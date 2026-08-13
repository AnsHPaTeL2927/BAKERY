import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, Eye, EyeOff, ChevronUp, ChevronDown, ArrowUpDown, GripVertical, Check } from 'lucide-react';
import { categoriesApi } from '../services/adminApi';
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
import { TextField, TextAreaField, SelectField } from '../components/FormField';
import useIsMobile from '../hooks/useIsMobile';

const EMPTY_FORM = { name: '', slug: '', description: '', status: 'LIVE' };

export default function AdminCategories() {
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

  const [pageSize, setPageSize] = useState(10);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: null }));
  }

  function validateForm() {
    const errs = {};
    const name = form.name?.trim() || '';
    if (name.length < 2 || name.length > 120) errs.name = 'Name must be between 2 and 120 characters';
    const slug = form.slug?.trim() || '';
    if (!slug) {
      errs.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      errs.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    if (form.description && form.description.length > 240) errs.description = 'Description must be 240 characters or fewer';
    if (modal.mode === 'create' && !imageFile) errs.image = 'Category image is required';
    return errs;
  }

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
    setFormErrors({});
    setImageFile(null);
    setExistingImage(null);
    setError('');
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({ name: item.name, slug: item.slug, description: item.description || '', status: item.status });
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

  // Mobile card list has no HTML5 drag-and-drop (touch drag across a scrolling
  // list is the most common mobile admin failure point) — up/down buttons
  // reuse the same handleReorder path the desktop drag handle already calls.
  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    handleReorder(reordered);
  }

  function renderCategoryCard(item, index) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.image}
        icon={LayoutGrid}
        title={item.name}
        subtitle={item.slug}
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
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Menu Management</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Categories</h1>
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
            <Plus className="h-4 w-4" /> New Category
          </button>
        </div>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      {isMobile && reorderMode ? (
        <>
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose/8 p-3">
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-rose-deep" />
            <p className="text-xs leading-relaxed text-rose-deep">
              Use the arrows to set the order shown on the website. Changes save as you go — tap Done when you're finished.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pb-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-admin border border-blush/70 bg-white p-2.5">
                <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-rose/10 text-xs font-extrabold text-rose-deep">
                  {index + 1}
                </span>
                <Thumbnail src={item.image} alt={item.name} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-cocoa">{item.name}</p>
                  <p className="truncate text-xs text-cocoa-soft/70">{item.status === 'LIVE' ? 'Visible' : 'Hidden'}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blush text-cocoa disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blush text-cocoa disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Both buttons close reorder mode — each move already persists immediately
              (same as the desktop drag handle), so there is nothing left to discard. */}
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
          <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" />

          {search && <p className="text-xs text-cocoa-soft/70">Clear the search to drag and reorder categories.</p>}

          <DataTable
            loading={loading}
            items={items}
            draggable={!search}
            onReorder={handleReorder}
            renderCard={renderCategoryCard}
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
        </>
      )}

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Category' : 'Edit Category'} onClose={() => setModal({ ...modal, open: false })}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <TextField label="Name" required value={form.name} error={formErrors.name} onChange={(e) => updateField('name', e.target.value)} />
          <TextField label="Slug" required value={form.slug} error={formErrors.slug} onChange={(e) => updateField('slug', e.target.value)} />
          <TextAreaField
            label="Short Description"
            placeholder="Optional — shown under the category on the homepage (e.g. 'Rich, layered, and made for celebrations')"
            maxLength={240}
            value={form.description}
            error={formErrors.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <ImageUploader
            label="Category Image"
            dimensions="800 × 800 px"
            initialUrl={existingImage}
            required={modal.mode === 'create'}
            onChange={(file) => {
              setImageFile(file);
              if (formErrors.image) setFormErrors((prev) => ({ ...prev, image: null }));
            }}
          />
          {formErrors.image && <p className="-mt-2 text-[11px] font-semibold text-rose-600">{formErrors.image}</p>}
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
