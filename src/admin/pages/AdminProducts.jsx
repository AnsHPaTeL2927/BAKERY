import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Star, Cake, RotateCcw, Eye, EyeOff, SlidersHorizontal } from 'lucide-react';
import { productsApi, categoriesApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
import CardListItem from '../components/CardListItem';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import ButtonLoader from '../../components/loading/ButtonLoader';
import { TextField, TextAreaField, SelectField, CheckboxField } from '../components/FormField';
import imageFallback from '../../assets/image-fallback.svg';
import ThemedSelect from '../../components/ThemedSelect';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from '../components/BottomSheet';

const EMPTY_FILTERS = { categoryId: '', status: '', featured: '', available: '', minPrice: '', maxPrice: '', sort: '' };

function ExistingImageThumb({ url }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? imageFallback : url}
      alt=""
      className="h-full w-full rounded-xl object-cover"
      onError={() => setFailed(true)}
    />
  );
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  featured: false,
  available: true,
  status: 'LIVE',
  sortOrder: 0,
};

export default function AdminProducts() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [weightRows, setWeightRows] = useState([{ weight: '', price: '' }]);
  const [flavoursList, setFlavoursList] = useState([]);
  const [flavourDraft, setFlavourDraft] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const [primaryImageId, setPrimaryImageId] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = Boolean(search || Object.values(filters).some(Boolean));
  const activeSheetFilterCount = [filters.categoryId, filters.status, filters.featured, filters.available, filters.minPrice, filters.maxPrice, filters.sort].filter(Boolean).length;

  async function load() {
    setLoading(true);
    try {
      const data = await productsApi.list({
        page,
        pageSize,
        search,
        categoryId: filters.categoryId || undefined,
        status: filters.status || undefined,
        featured: filters.featured || undefined,
        available: filters.available || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort: filters.sort || undefined,
      });
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
  }, [page, pageSize, search, filters]);

  function handlePageSizeChange(size) {
    setPageSize(size);
    setPage(1);
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  useEffect(() => {
    categoriesApi.list({ page: 1, pageSize: 100 }).then((data) => setCategories(data.items)).catch(() => {});
  }, []);

  function resetImageState() {
    setExistingImages([]);
    setRemoveImageIds([]);
    setPrimaryImageId(null);
    setNewFiles([]);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setWeightRows([{ weight: '', price: '' }]);
    setFlavoursList([]);
    setFlavourDraft('');
    resetImageState();
    setError('');
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({
      name: item.name,
      slug: item.slug,
      categoryId: item.category?.id || item.categoryId || '',
      description: item.description,
      featured: item.featured,
      available: item.available,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    const weights = Array.isArray(item.weights) ? item.weights : [];
    const priceByWeight = item.priceByWeight || {};
    setWeightRows(weights.length ? weights.map((w) => ({ weight: w, price: priceByWeight[w] ?? '' })) : [{ weight: '', price: '' }]);
    setFlavoursList(Array.isArray(item.flavours) ? item.flavours : []);
    setFlavourDraft('');
    setExistingImages(item.images || []);
    setRemoveImageIds([]);
    setPrimaryImageId(item.images?.find((img) => img.isPrimary)?.id || null);
    setNewFiles([]);
    setError('');
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  function addWeightRow() {
    setWeightRows([...weightRows, { weight: '', price: '' }]);
  }

  function updateWeightRow(index, field, value) {
    setWeightRows(weightRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeWeightRow(index) {
    setWeightRows(weightRows.filter((_, i) => i !== index));
  }

  function addFlavour() {
    const value = flavourDraft.trim();
    if (!value) return;
    setFlavoursList((prev) => (prev.some((f) => f.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]));
    setFlavourDraft('');
  }

  function removeFlavour(index) {
    setFlavoursList((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNewFiles(e) {
    setNewFiles([...newFiles, ...Array.from(e.target.files || [])]);
    e.target.value = '';
  }

  function removeNewFile(index) {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  }

  function toggleRemoveExisting(id) {
    setRemoveImageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validRows = weightRows.filter((row) => row.weight.trim());
    if (validRows.length === 0) {
      setError('Add at least one weight/size option with a price');
      return;
    }

    const remainingExisting = existingImages.filter((img) => !removeImageIds.includes(img.id));
    if (modal.mode === 'create' && newFiles.length === 0) {
      setError('At least one product image is required');
      return;
    }
    if (modal.mode === 'edit' && remainingExisting.length === 0 && newFiles.length === 0) {
      setError('A product needs at least one image');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const weights = validRows.map((row) => row.weight.trim());
      const priceByWeight = Object.fromEntries(validRows.map((row) => [row.weight.trim(), Number(row.price) || 0]));
      const flavours = flavoursList.map((f) => f.trim()).filter(Boolean);

      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('slug', form.slug);
      if (form.categoryId) fd.append('categoryId', form.categoryId);
      fd.append('description', form.description);
      fd.append('weights', JSON.stringify(weights));
      fd.append('priceByWeight', JSON.stringify(priceByWeight));
      fd.append('flavours', JSON.stringify(flavours));
      fd.append('featured', form.featured);
      fd.append('available', form.available);
      fd.append('status', form.status);
      fd.append('sortOrder', form.sortOrder);
      newFiles.forEach((file) => fd.append('images', file));

      if (modal.mode === 'create') {
        await productsApi.create(fd);
      } else {
        if (removeImageIds.length) fd.append('removeImageIds', JSON.stringify(removeImageIds));
        if (primaryImageId) fd.append('newPrimaryImageId', primaryImageId);
        await productsApi.update(modal.id, fd);
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
      await productsApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await productsApi.setStatus(item.id, next);
    load();
  }

  function renderProductCard(item) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.image}
        icon={Cake}
        title={item.name}
        subtitle={item.category?.name || 'Uncategorised'}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            {item.featured && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-cocoa">Featured</span>}
            {!item.available && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Unavailable</span>}
          </div>
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
          <h1 className="font-display text-3xl font-semibold text-admin-text">Products</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-admin-primary px-5 py-2.5 font-semibold text-white hover:bg-admin-primary-hover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      {/* Desktop: search + inline filters. Mobile: search + Filters funnel button. */}
      <div className="hidden flex-wrap items-center gap-3 sm:flex">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
      </div>
      <div className="flex items-center gap-2.5 sm:hidden">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="relative flex h-11.5 min-w-11.5 shrink-0 items-center justify-center rounded-2xl border border-admin-primary bg-admin-primary/8 px-3 text-admin-primary"
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          {activeSheetFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-admin-bg bg-admin-primary px-1 text-[11px] font-extrabold text-white">
              {activeSheetFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop inline filter bar */}
      <div className="hidden flex-wrap items-center gap-3 rounded-2xl border border-admin-border/60 bg-admin-card p-4 sm:flex">
        <ThemedSelect
          theme="admin"
          className="w-40"
          value={filters.categoryId}
          onChange={(v) => updateFilter('categoryId', v)}
          options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <ThemedSelect
          theme="admin"
          className="w-36"
          value={filters.status}
          onChange={(v) => updateFilter('status', v)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'LIVE', label: 'Live' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'HIDDEN', label: 'Hidden' },
          ]}
        />
        <ThemedSelect
          theme="admin"
          className="w-40"
          value={filters.featured}
          onChange={(v) => updateFilter('featured', v)}
          options={[
            { value: '', label: 'Featured: Any' },
            { value: 'true', label: 'Featured' },
            { value: 'false', label: 'Not Featured' },
          ]}
        />
        <ThemedSelect
          theme="admin"
          className="w-44"
          value={filters.available}
          onChange={(v) => updateFilter('available', v)}
          options={[
            { value: '', label: 'Availability: Any' },
            { value: 'true', label: 'Available' },
            { value: 'false', label: 'Unavailable' },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            placeholder="Min ₹"
            className="w-20 rounded-2xl border border-admin-border px-3 py-2 text-xs text-admin-text"
          />
          <span className="text-xs text-admin-muted">–</span>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            placeholder="Max ₹"
            className="w-20 rounded-2xl border border-admin-border px-3 py-2 text-xs text-admin-text"
          />
        </div>
        <ThemedSelect
          theme="admin"
          className="w-40"
          value={filters.sort}
          onChange={(v) => updateFilter('sort', v)}
          options={[
            { value: '', label: 'Sort: Default' },
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' },
          ]}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-xl border border-admin-border px-3.5 py-2.5 text-sm font-semibold text-admin-muted hover:bg-admin-bg hover:text-admin-text transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Reset Filters
          </button>
        )}
      </div>

      {/* Mobile filter BottomSheet — same pattern as Orders module */}
      <BottomSheet
        open={showFilters && isMobile}
        title="Filters"
        onClose={() => setShowFilters(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                resetFilters();
                setShowFilters(false);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-admin-border bg-admin-card py-3 text-sm font-bold text-admin-text"
            >
              <RotateCcw className="h-4 w-4" /> Reset all
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="flex flex-[1.4] items-center justify-center rounded-2xl bg-admin-primary py-3 text-sm font-bold text-white"
            >
              Apply filters
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Category</p>
            <div className="flex flex-wrap gap-2">
              {[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))].map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => updateFilter('categoryId', opt.value)}
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                    filters.categoryId === opt.value
                      ? 'bg-admin-primary/10 text-admin-primary'
                      : 'border border-admin-border bg-admin-card text-admin-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: 'All' },
                { value: 'LIVE', label: 'Live' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'HIDDEN', label: 'Hidden' },
              ].map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => updateFilter('status', opt.value)}
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                    filters.status === opt.value
                      ? 'bg-admin-primary/10 text-admin-primary'
                      : 'border border-admin-border bg-admin-card text-admin-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Featured</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: 'Any' },
                { value: 'true', label: 'Featured' },
                { value: 'false', label: 'Not Featured' },
              ].map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => updateFilter('featured', opt.value)}
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                    filters.featured === opt.value
                      ? 'bg-admin-primary/10 text-admin-primary'
                      : 'border border-admin-border bg-admin-card text-admin-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Availability</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '', label: 'Any' },
                { value: 'true', label: 'Available' },
                { value: 'false', label: 'Unavailable' },
              ].map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => updateFilter('available', opt.value)}
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                    filters.available === opt.value
                      ? 'bg-admin-primary/10 text-admin-primary'
                      : 'border border-admin-border bg-admin-card text-admin-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Price range</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                placeholder="Min ₹"
                className="w-full rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text"
              />
              <span className="text-xs text-admin-muted">–</span>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                placeholder="Max ₹"
                className="w-full rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text"
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Sort</p>
            <ThemedSelect
              theme="admin"
              value={filters.sort}
              onChange={(v) => updateFilter('sort', v)}
              options={[
                { value: '', label: 'Default' },
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
              ]}
            />
          </div>
        </div>
      </BottomSheet>

      <DataTable
        theme="admin"
        loading={loading}
        items={items}
        renderCard={renderProductCard}
        renderEmpty={
          <EmptyState
            icon={Cake}
            title="No products yet"
            message="Add your first product to start building the menu."
            actionLabel="New Product"
            onAction={openCreate}
          />
        }
        columns={[
          { key: 'image', label: 'Image', render: (i) => <Thumbnail src={i.image} alt={i.name} /> },
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category', render: (i) => i.category?.name || '—' },
          { key: 'featured', label: 'Featured', render: (i) => (i.featured ? 'Yes' : 'No') },
          { key: 'available', label: 'Available', render: (i) => (i.available ? 'Yes' : 'No') },
          { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
        ]}
        renderActions={(item) => (
          <>
            <button
              type="button"
              onClick={() => handleStatusToggle(item)}
              className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold text-admin-text hover:bg-admin-bg"
            >
              {item.status === 'LIVE' ? 'Hide' : 'Publish'}
            </button>
            <button type="button" onClick={() => openEdit(item)} className="rounded-full border border-admin-border p-1.5 text-admin-text hover:bg-admin-bg">
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

      <Pagination theme="admin" page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Product' : 'Edit Product'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa md:col-span-2">{error}</p>}
          <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <SelectField
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
          <TextAreaField
            label="Description"
            required
            containerClassName="md:col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">
              Weights / Sizes &amp; Prices <span className="text-rose-deep">*</span>
            </span>
            <div className="space-y-2">
              {weightRows.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="w-full rounded-2xl border border-blush p-2.5 text-sm"
                    placeholder="e.g. 500g"
                    value={row.weight}
                    onChange={(e) => updateWeightRow(index, 'weight', e.target.value)}
                  />
                  <input
                    className="w-32 rounded-2xl border border-blush p-2.5 text-sm"
                    type="number"
                    placeholder="Price"
                    value={row.price}
                    onChange={(e) => updateWeightRow(index, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeWeightRow(index)}
                    className="rounded-full border border-red-200 px-3 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addWeightRow} className="mt-2 text-sm font-semibold text-rose-deep hover:underline">
              + Add another size
            </button>
          </div>

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">Flavours</span>
            <div className="flex gap-2">
              <input
                className="w-full rounded-2xl border border-blush p-2.5 text-sm"
                placeholder="e.g. Chocolate Truffle"
                value={flavourDraft}
                onChange={(e) => setFlavourDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFlavour();
                  }
                }}
              />
              <button
                type="button"
                onClick={addFlavour}
                className="shrink-0 rounded-2xl border border-blush px-4 text-sm font-semibold text-rose-deep hover:bg-blush-soft"
              >
                Add
              </button>
            </div>
            {flavoursList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {flavoursList.map((f, index) => (
                  <span
                    key={`${f}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blush-soft px-3 py-1 text-xs font-semibold text-cocoa"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFlavour(index)}
                      className="rounded-full text-cocoa-soft hover:text-red-600"
                      aria-label={`Remove ${f}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-cocoa-soft/70">Press Enter or click Add after typing each flavour.</p>
          </div>

          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">
              Product Images <span className="text-rose-deep">*</span>
            </span>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => {
                const marked = removeImageIds.includes(img.id);
                return (
                  <div key={img.id} className={`relative h-20 w-20 rounded-xl border ${marked ? 'opacity-30' : 'border-blush'}`}>
                    <ExistingImageThumb url={img.url} />
                    <button
                      type="button"
                      onClick={() => setPrimaryImageId(img.id)}
                      className={`absolute -top-2 -left-2 rounded-full p-1 ${
                        primaryImageId === img.id ? 'bg-gold text-cocoa' : 'bg-white text-cocoa-soft'
                      }`}
                      title="Set as primary"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRemoveExisting(img.id)}
                      className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-red-600"
                      title={marked ? 'Undo remove' : 'Remove'}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {newFiles.map((file, index) => (
                <div key={index} className="relative h-20 w-20 rounded-xl border border-blush">
                  <img src={URL.createObjectURL(file)} alt="" className="h-full w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-blush text-xs text-cocoa-soft">
                + Add
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewFiles} className="hidden" />
              </label>
            </div>
            <p className="mt-1 text-xs text-cocoa-soft/70">Recommended Size: 800 × 800 px</p>
            <p className="text-xs text-cocoa-soft/70">Formats: JPG, PNG, WEBP · Max Size: 5 MB</p>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">Status</span>
            <ThemedSelect
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: 'LIVE', label: 'Live' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'HIDDEN', label: 'Hidden' },
              ]}
            />
          </div>
          <div className="flex items-end gap-6">
            <CheckboxField label="Featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <CheckboxField label="Available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          </div>

          <button type="submit" disabled={saving} className="rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60 md:col-span-2">
            {saving ? <ButtonLoader /> : 'Save Product'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Product"
        message="This will permanently delete this product and its images."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
