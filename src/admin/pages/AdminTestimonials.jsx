import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, MessageSquareQuote, Eye, EyeOff, Check, X } from 'lucide-react';
import { testimonialsApi } from '../services/adminApi';
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
import { TextField, TextAreaField, SelectField, CheckboxField } from '../components/FormField';

const EMPTY_FORM = { name: '', review: '', rating: 5, approved: true, featured: false, status: 'LIVE', sortOrder: 0 };

const APPROVAL_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approval, setApproval] = useState('');
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
    const review = form.review?.trim() || '';
    if (review.length < 5 || review.length > 2000) errs.review = 'Review must be between 5 and 2000 characters';
    const rating = Number(form.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errs.rating = 'Rating must be between 1 and 5 stars';
    return errs;
  }

  async function load() {
    setLoading(true);
    try {
      const data = await testimonialsApi.list({ page, pageSize, search, approval: approval || undefined });
      setItems(data.items);
      setTotal(data.total);
      setPendingCount(data.pendingCount ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, approval]);

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
    setForm({
      name: item.name,
      review: item.review,
      rating: item.rating,
      approved: item.approved,
      featured: item.featured,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    setFormErrors({});
    setImageFile(null);
    setExistingImage(item.photo);
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
      if (imageFile) fd.append('photo', imageFile);

      if (modal.mode === 'create') {
        await testimonialsApi.create(fd);
      } else {
        await testimonialsApi.update(modal.id, fd);
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
      await testimonialsApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await testimonialsApi.setStatus(item.id, next);
    load();
  }

  // Reviews submitted from the public site arrive unapproved and hidden.
  // Approving publishes them in one step; rejecting leaves the row in place
  // (searchable, deletable) but keeps it off the site.
  async function handleApproval(item, approved) {
    try {
      await testimonialsApi.setApproval(item.id, approved);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderTestimonialCard(item) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.photo}
        icon={MessageSquareQuote}
        title={item.name}
        subtitle={item.review}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            <span className="flex items-center gap-0.5 text-gold">
              {Array.from({ length: item.rating }).map((_, idx) => (
                <Star key={idx} className="h-3 w-3 fill-gold" />
              ))}
            </span>
            {item.featured && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-cocoa">Featured</span>}
            {!item.approved && (
              <span className="rounded-full bg-admin-warning/15 px-2 py-0.5 text-[10px] font-bold text-admin-warning">
                Pending approval
              </span>
            )}
          </div>
        }
        actions={[
          item.approved
            ? { icon: X, label: 'Un-approve', onClick: () => handleApproval(item, false) }
            : { icon: Check, label: 'Approve', onClick: () => handleApproval(item, true) },
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
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Social Proof</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Testimonials</h1>
          <p className="mt-1 text-sm text-admin-muted">
            {pendingCount > 0 ? (
              <>
                <span className="font-semibold text-admin-warning">{pendingCount}</span> customer review
                {pendingCount === 1 ? '' : 's'} waiting for approval
              </>
            ) : (
              'Customer-submitted reviews appear here for approval before going live.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 font-semibold text-white hover:bg-rose-deep"
        >
          <Plus className="h-4 w-4" /> New Testimonial
        </button>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" />
        <div className="flex gap-2">
          {APPROVAL_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => {
                setApproval(filter.value);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                approval === filter.value
                  ? 'bg-admin-primary text-white'
                  : 'border border-admin-border text-admin-muted hover:bg-admin-bg'
              }`}
            >
              {filter.label}
              {filter.value === 'pending' && pendingCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    approval === 'pending' ? 'bg-white/25 text-white' : 'bg-admin-warning/15 text-admin-warning'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        loading={loading}
        items={items}
        renderCard={renderTestimonialCard}
        renderEmpty={
          <EmptyState
            icon={MessageSquareQuote}
            title="No testimonials yet"
            message="Add a customer review to build trust on your homepage."
            actionLabel="New Testimonial"
            onAction={openCreate}
          />
        }
        columns={[
          { key: 'photo', label: 'Photo', render: (i) => <Thumbnail src={i.photo} alt={i.name} /> },
          { key: 'name', label: 'Name' },
          {
            key: 'rating',
            label: 'Rating',
            render: (i) => (
              <span className="flex gap-0.5 text-gold">
                {Array.from({ length: i.rating }).map((_, idx) => (
                  <Star key={idx} className="h-3.5 w-3.5 fill-gold" />
                ))}
              </span>
            ),
          },
          {
            key: 'review',
            label: 'Review',
            render: (i) => <p className="max-w-xs truncate text-sm text-admin-muted" title={i.review}>{i.review}</p>,
          },
          {
            key: 'approved',
            label: 'Approval',
            render: (i) =>
              i.approved ? (
                <span className="rounded-full bg-admin-success/10 px-2.5 py-1 text-xs font-semibold text-admin-success">Approved</span>
              ) : (
                <span className="rounded-full bg-admin-warning/15 px-2.5 py-1 text-xs font-semibold text-admin-warning">Pending</span>
              ),
          },
          { key: 'createdAt', label: 'Received', render: (i) => <span className="text-sm text-admin-muted">{formatDate(i.createdAt)}</span> },
          { key: 'status', label: 'Status', render: (i) => <StatusBadge status={i.status} /> },
        ]}
        renderActions={(item) => (
          <>
            {item.approved ? (
              <button
                type="button"
                onClick={() => handleApproval(item, false)}
                title="Un-approve — removes it from the public site"
                className="rounded-full border border-admin-border p-1.5 text-admin-muted hover:bg-admin-bg"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleApproval(item, true)}
                title="Approve and publish"
                className="flex items-center gap-1 rounded-full bg-admin-success px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
            )}
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

      <Modal
        open={modal.open}
        title={modal.mode === 'create' ? 'New Testimonial' : 'Edit Testimonial'}
        onClose={() => setModal({ ...modal, open: false })}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <ImageUploader label="Photo (optional)" dimensions="500 × 500 px" initialUrl={existingImage} onChange={setImageFile} />
          <TextField label="Name" required value={form.name} error={formErrors.name} onChange={(e) => updateField('name', e.target.value)} />
          <TextAreaField label="Review" required value={form.review} error={formErrors.review} onChange={(e) => updateField('review', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Rating"
              value={form.rating}
              error={formErrors.rating}
              onChange={(e) => updateField('rating', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? 's' : ''}
                </option>
              ))}
            </SelectField>
            <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="LIVE">Live</option>
              <option value="DRAFT">Draft</option>
              <option value="HIDDEN">Hidden</option>
            </SelectField>
          </div>
          <div className="flex gap-6">
            <CheckboxField label="Approved" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />
            <CheckboxField label="Featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          </div>
          <button type="submit" disabled={saving} className="w-full rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60">
            {saving ? <ButtonLoader /> : 'Save Testimonial'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Testimonial"
        message="This will permanently delete this testimonial."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
