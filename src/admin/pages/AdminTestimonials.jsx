import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, MessageSquareQuote } from 'lucide-react';
import { testimonialsApi } from '../services/adminApi';
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
import { TextField, TextAreaField, SelectField, CheckboxField } from '../components/FormField';

const EMPTY_FORM = { name: '', review: '', rating: 5, approved: true, featured: false, status: 'LIVE', sortOrder: 0 };

export default function AdminTestimonials() {
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
      const data = await testimonialsApi.list({ page, pageSize, search });
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
      name: item.name,
      review: item.review,
      rating: item.rating,
      approved: item.approved,
      featured: item.featured,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    setImageFile(null);
    setExistingImage(item.photo);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Social Proof</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Testimonials</h1>
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

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name…" />

      <DataTable
        loading={loading}
        items={items}
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
          { key: 'approved', label: 'Approved', render: (i) => (i.approved ? 'Yes' : 'No') },
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

      <Modal
        open={modal.open}
        title={modal.mode === 'create' ? 'New Testimonial' : 'Edit Testimonial'}
        onClose={() => setModal({ ...modal, open: false })}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}
          <ImageUploader label="Photo (optional)" dimensions="500 × 500 px" initialUrl={existingImage} onChange={setImageFile} />
          <TextField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextAreaField label="Review" required value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Rating"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
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
