import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, MessageSquareQuote, Eye, EyeOff, Check, X, BookOpen } from 'lucide-react';
import { testimonialsApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
import CardListItem from '../components/CardListItem';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import BottomSheet from '../components/BottomSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import ImageUploader from '../components/ImageUploader';
import EmptyState from '../components/EmptyState';
import ButtonLoader from '../../components/loading/ButtonLoader';
import { TextField, TextAreaField, SelectField, CheckboxField } from '../components/FormField';
import useIsMobile from '../hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approval, setApproval] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewItem, setViewItem] = useState(null);
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
        if (viewItem && viewItem.id === modal.id) setViewItem((prev) => ({ ...prev, ...form }));
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
      setViewItem(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await testimonialsApi.setStatus(item.id, next);
    if (viewItem && viewItem.id === item.id) setViewItem((prev) => ({ ...prev, status: next }));
    load();
  }

  async function handleApproval(item, approved) {
    try {
      await testimonialsApi.setApproval(item.id, approved);
      if (viewItem && viewItem.id === item.id) setViewItem((prev) => ({ ...prev, approved, status: approved ? 'LIVE' : prev.status }));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderTestimonialCard(item) {
    const isPending = !item.approved;
    const isLive = item.status === 'LIVE';

    return (
      <div
        className={`overflow-hidden rounded-[22px] border bg-admin-card shadow-xs transition-all duration-200 hover:shadow-md ${
          isPending ? 'border-admin-warning/50 ring-1 ring-admin-warning/20' : 'border-admin-border'
        }`}
        onClick={() => setViewItem(item)}
      >
        {/* Header: Photo / Avatar + Name + Rating + Status Badges */}
        <div className="flex items-center justify-between gap-3 border-b border-admin-border/60 px-4 py-3.5 bg-admin-bg/30">
          <div className="flex items-center gap-3 min-w-0">
            {item.photo ? (
              <img src={item.photo} alt={item.name} className="h-10 w-10 shrink-0 rounded-full object-cover border border-admin-border" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary font-bold text-sm">
                {(item.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-admin-text">{item.name}</p>
              <div className="flex items-center gap-1 text-gold mt-0.5">
                {Array.from({ length: Math.min(5, Math.max(1, item.rating || 5)) }).map((_, idx) => (
                  <Star key={idx} className="h-3 w-3 fill-gold" />
                ))}
                <span className="text-xs font-bold text-admin-text ml-1">{item.rating || 5}.0</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {isPending ? (
              <span className="rounded-full bg-admin-warning/15 px-2.5 py-0.5 text-xs font-bold text-admin-warning">
                Pending
              </span>
            ) : (
              <span className="rounded-full bg-admin-success/15 px-2.5 py-0.5 text-xs font-bold text-admin-success">
                Approved
              </span>
            )}
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Quote / Review Content */}
        <div className="p-4" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <div className="relative rounded-xl border border-admin-border/50 bg-admin-bg/50 p-3.5 cursor-pointer" onClick={() => setViewItem(item)}>
            <MessageSquareQuote className="h-4 w-4 text-admin-primary/40 mb-1" />
            <p className="text-xs sm:text-sm text-admin-text leading-relaxed line-clamp-3 italic">"{item.review}"</p>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-admin-muted font-medium px-0.5">
            <span>Submitted: {formatDate(item.createdAt)}</span>
            {item.featured && <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">★ Featured</span>}
          </div>
        </div>

        {/* Footer Quick Action Buttons */}
        <div
          className="flex items-center gap-2 border-t border-admin-border/60 bg-admin-bg/40 px-4 py-2.5"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setViewItem(item)}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-admin-primary text-xs font-bold text-white transition-colors hover:bg-admin-primary-hover shadow-2xs"
          >
            <BookOpen className="h-4 w-4" /> Full View
          </button>
          {isPending ? (
            <button
              type="button"
              onClick={() => handleApproval(item, true)}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-admin-success px-3 text-xs font-bold text-white transition-colors hover:bg-emerald-600 shadow-2xs"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Approve
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleApproval(item, false)}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-admin-border bg-admin-card px-2.5 text-xs font-semibold text-admin-muted hover:bg-admin-bg hover:text-admin-text transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Un-approve
            </button>
          )}

          <button
            type="button"
            onClick={() => openEdit(item)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-admin-border text-admin-text transition-colors hover:bg-admin-bg"
            title="Edit Testimonial"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(item.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50"
            title="Delete Testimonial"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-admin-primary">Social Proof</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-admin-text">Testimonials</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-admin-muted">
            {pendingCount > 0 ? (
              <>
                <span className="font-bold text-admin-warning">{pendingCount}</span> customer review
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
          className="flex items-center justify-center gap-2 rounded-xl bg-admin-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-admin-primary-hover transition-colors shadow-xs w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> New Testimonial
        </button>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" />
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {APPROVAL_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => {
                setApproval(filter.value);
                setPage(1);
              }}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                approval === filter.value
                  ? 'bg-admin-primary text-white shadow-xs'
                  : 'border border-admin-border text-admin-muted bg-admin-card hover:bg-admin-bg'
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
        actionsPosition="start"
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
                {Array.from({ length: Math.min(5, Math.max(1, i.rating || 5)) }).map((_, idx) => (
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
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewItem(item)}
              title="Read Full Review"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border bg-admin-card text-admin-primary hover:bg-admin-primary/10 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
            </button>
            {item.approved ? (
              <button
                type="button"
                onClick={() => handleApproval(item, false)}
                title="Un-approve Review"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border bg-admin-card text-admin-muted hover:bg-admin-bg hover:text-admin-text transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleApproval(item, true)}
                title="Approve & Publish Review"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-admin-success text-white hover:bg-emerald-600 shadow-2xs transition-colors"
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleStatusToggle(item)}
              title={item.status === 'LIVE' ? 'Hide from website' : 'Make live on website'}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border text-admin-text hover:bg-admin-bg transition-colors"
            >
              {item.status === 'LIVE' ? <EyeOff className="h-4 w-4 text-admin-muted" /> : <Eye className="h-4 w-4 text-admin-primary" />}
            </button>
            <button
              type="button"
              onClick={() => openEdit(item)}
              title="Edit Review"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border text-admin-text hover:bg-admin-bg transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(item.id)}
              title="Delete Review"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />

      {/* Full View Modal / BottomSheet for Review */}
      {viewItem && isMobile && (
        <BottomSheet
          open
          onClose={() => setViewItem(null)}
          title={viewItem.name}
          footer={
            <div className="flex gap-2">
              {!viewItem.approved ? (
                <button
                  type="button"
                  onClick={() => handleApproval(viewItem, true)}
                  className="flex-1 rounded-xl bg-admin-success py-3 text-xs font-bold text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" /> Approve &amp; Publish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApproval(viewItem, false)}
                  className="flex-1 rounded-xl border border-admin-border bg-admin-card py-3 text-xs font-bold text-admin-text hover:bg-admin-bg transition-colors"
                >
                  Un-approve
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const target = viewItem;
                  setViewItem(null);
                  openEdit(target);
                }}
                className="rounded-xl border border-admin-border bg-admin-card px-4 py-3 text-xs font-bold text-admin-text hover:bg-admin-bg transition-colors"
              >
                Edit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {viewItem.photo ? (
                <img src={viewItem.photo} alt={viewItem.name} className="h-12 w-12 rounded-full object-cover border border-admin-border" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary font-bold text-base">
                  {(viewItem.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-base text-admin-text">{viewItem.name}</p>
                <div className="flex items-center gap-1 text-gold mt-0.5">
                  {Array.from({ length: Math.min(5, Math.max(1, viewItem.rating || 5)) }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-gold" />
                  ))}
                  <span className="text-xs font-bold text-admin-text ml-1">{viewItem.rating || 5}.0 Rating</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewItem.approved ? (
                <span className="rounded-full bg-admin-success/15 px-3 py-1 text-xs font-bold text-admin-success">Approved</span>
              ) : (
                <span className="rounded-full bg-admin-warning/15 px-3 py-1 text-xs font-bold text-admin-warning">Pending Approval</span>
              )}
              <StatusBadge status={viewItem.status} />
              {viewItem.featured && <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs border border-amber-200">★ Featured</span>}
            </div>

            <div className="rounded-2xl bg-admin-bg p-4 border border-admin-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted mb-2 flex items-center gap-1.5">
                <MessageSquareQuote className="h-4 w-4 text-admin-primary" /> Full Customer Review
              </p>
              <p className="whitespace-pre-wrap text-sm text-admin-text leading-relaxed font-normal">"{viewItem.review}"</p>
            </div>

            <p className="text-xs text-admin-muted">Submitted on {formatDate(viewItem.createdAt)}</p>
          </div>
        </BottomSheet>
      )}

      {viewItem && !isMobile && (
        <Modal open title="Customer Testimonial" onClose={() => setViewItem(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewItem.photo ? (
                  <img src={viewItem.photo} alt={viewItem.name} className="h-12 w-12 rounded-full object-cover border border-admin-border" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-primary/10 text-admin-primary font-bold text-base">
                    {(viewItem.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-admin-text">{viewItem.name}</h3>
                  <div className="flex items-center gap-1 text-gold mt-0.5">
                    {Array.from({ length: Math.min(5, Math.max(1, viewItem.rating || 5)) }).map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-gold" />
                    ))}
                    <span className="text-xs font-bold text-admin-text ml-1">{viewItem.rating || 5}.0</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewItem.approved ? (
                  <span className="rounded-full bg-admin-success/15 px-3 py-1 text-xs font-bold text-admin-success">Approved</span>
                ) : (
                  <span className="rounded-full bg-admin-warning/15 px-3 py-1 text-xs font-bold text-admin-warning">Pending</span>
                )}
                <StatusBadge status={viewItem.status} />
              </div>
            </div>

            <div className="rounded-2xl bg-admin-bg p-4 border border-admin-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted mb-2 flex items-center gap-1.5">
                <MessageSquareQuote className="h-4 w-4 text-admin-primary" /> Review Content
              </p>
              <p className="whitespace-pre-wrap text-sm text-admin-text leading-relaxed">"{viewItem.review}"</p>
            </div>

            <p className="text-xs text-admin-muted">Submitted on {formatDate(viewItem.createdAt)}</p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-admin-border">
              {!viewItem.approved ? (
                <button
                  type="button"
                  onClick={() => handleApproval(viewItem, true)}
                  className="rounded-xl bg-admin-success px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" /> Approve &amp; Publish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApproval(viewItem, false)}
                  className="rounded-xl border border-admin-border px-4 py-2 text-xs font-semibold text-admin-muted hover:bg-admin-bg hover:text-admin-text transition-colors"
                >
                  Un-approve
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const target = viewItem;
                  setViewItem(null);
                  openEdit(target);
                }}
                className="rounded-xl border border-admin-border px-4 py-2 text-xs font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={modal.open}
        title={modal.mode === 'create' ? 'New Testimonial' : 'Edit Testimonial'}
        onClose={() => setModal({ ...modal, open: false })}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <ImageUploader label="Photo (optional)" dimensions="500 × 500 px" initialUrl={existingImage} onChange={setImageFile} />
          <TextField label="Name" required description="Full name of the customer providing feedback." value={form.name} error={formErrors.name} onChange={(e) => updateField('name', e.target.value)} />
          <TextAreaField label="Review" required description="Customer feedback message shown on site." value={form.review} error={formErrors.review} onChange={(e) => updateField('review', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Rating"
              description="Star rating (1-5)."
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
            <SelectField label="Status" description="Publication state." value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="LIVE">Live</option>
              <option value="DRAFT">Draft</option>
              <option value="HIDDEN">Hidden</option>
            </SelectField>
          </div>
          <div className="flex flex-col gap-2">
            <CheckboxField label="Approved" description="Approved reviews are permitted for public display." checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />
            <CheckboxField label="Featured" description="Highlighted on homepage testimonials carousel." checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
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
