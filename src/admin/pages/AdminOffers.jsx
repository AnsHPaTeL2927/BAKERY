import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Gift, Eye, EyeOff } from 'lucide-react';
import { offersApi } from '../services/adminApi';
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
import DatePicker from '../../components/DatePicker';

const EMPTY_FORM = {
  festival: '',
  title: '',
  description: '',
  discount: '',
  ctaText: '',
  startDate: '',
  endDate: '',
  active: false,
  priority: 0,
  status: 'LIVE',
};

export default function AdminOffers() {
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
    if (!form.festival?.trim() || form.festival.trim().length < 2) errs.festival = 'Festival name must be at least 2 characters';
    if (!form.title?.trim() || form.title.trim().length < 2) errs.title = 'Title must be at least 2 characters';
    if (!form.description?.trim() || form.description.trim().length < 5) errs.description = 'Description must be at least 5 characters';
    if (!form.discount?.trim()) errs.discount = 'Discount text is required';
    if (!form.ctaText?.trim()) errs.ctaText = 'CTA text is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errs.endDate = 'End date must be on or after the start date';
    }
    if (modal.mode === 'create' && !imageFile) errs.banner = 'Banner image is required';
    return errs;
  }

  async function load() {
    setLoading(true);
    try {
      const data = await offersApi.list({ page, pageSize, search });
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
    setForm({
      festival: item.festival,
      title: item.title,
      description: item.description,
      discount: item.discount,
      ctaText: item.ctaText,
      startDate: item.startDate?.slice(0, 10) || '',
      endDate: item.endDate?.slice(0, 10) || '',
      active: item.active,
      priority: item.priority,
      status: item.status,
    });
    setFormErrors({});
    setImageFile(null);
    setExistingImage(item.banner);
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
      if (imageFile) fd.append('banner', imageFile);

      if (modal.mode === 'create') {
        await offersApi.create(fd);
      } else {
        await offersApi.update(modal.id, fd);
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
      await offersApi.remove(confirmDelete);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(item) {
    const next = item.status === 'LIVE' ? 'HIDDEN' : 'LIVE';
    await offersApi.setStatus(item.id, next);
    load();
  }

  function renderOfferCard(item) {
    return (
      <CardListItem
        id={item.id}
        theme="public"
        image={item.banner}
        icon={Gift}
        title={item.title}
        subtitle={item.festival}
        meta={<span className="font-semibold text-cocoa">{item.discount}</span>}
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            {item.active && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-cocoa">Active</span>}
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
          <p className="text-sm uppercase tracking-[0.3em] text-rose-deep">Promotions</p>
          <h1 className="font-display text-3xl font-semibold text-cocoa">Festival Offers</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 font-semibold text-white hover:bg-rose-deep"
        >
          <Plus className="h-4 w-4" /> New Offer
        </button>
      </div>

      {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa">{error}</p>}

      <SearchInput value={search} onChange={setSearch} placeholder="Search offers…" />

      <DataTable
        loading={loading}
        items={items}
        renderCard={renderOfferCard}
        renderEmpty={
          <EmptyState
            icon={Gift}
            title="No festival offers yet"
            message="Create a seasonal offer to promote it on the homepage."
            actionLabel="New Offer"
            onAction={openCreate}
          />
        }
        columns={[
          { key: 'banner', label: 'Banner', render: (i) => <Thumbnail src={i.banner} alt={i.title} /> },
          { key: 'festival', label: 'Festival' },
          { key: 'discount', label: 'Discount' },
          { key: 'active', label: 'Active', render: (i) => (i.active ? 'Yes' : 'No') },
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

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Offer' : 'Edit Offer'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {error && <p className="rounded-2xl bg-blush-soft p-3 text-sm text-cocoa md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <ImageUploader
              label="Banner Image"
              dimensions="1200 × 600 px"
              initialUrl={existingImage}
              required={modal.mode === 'create'}
              onChange={(file) => {
                setImageFile(file);
                if (formErrors.banner) setFormErrors({ ...formErrors, banner: null });
              }}
            />
            {formErrors.banner && <p className="mt-1 text-[11px] font-semibold text-rose-600">{formErrors.banner}</p>}
          </div>
          <TextField label="Festival" required description="Event or campaign title (e.g. Diwali Specials, Valentine Week)." value={form.festival} error={formErrors.festival} onChange={(e) => updateField('festival', e.target.value)} />
          <TextField label="Title" required description="Main headline of the promotional offer." value={form.title} error={formErrors.title} onChange={(e) => updateField('title', e.target.value)} />
          <TextAreaField
            label="Description"
            required
            description="Detailed summary of offer conditions, included cakes, or freebies."
            containerClassName="md:col-span-2"
            value={form.description}
            error={formErrors.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <TextField label="Discount Text" required description="Highlight badge text (e.g. '20% OFF' or 'Flat ₹150 OFF')." value={form.discount} error={formErrors.discount} onChange={(e) => updateField('discount', e.target.value)} />
          <TextField label="CTA Text" required description="Action button label (e.g. 'Order Festival Cake')." value={form.ctaText} error={formErrors.ctaText} onChange={(e) => updateField('ctaText', e.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-admin-text">
              Start Date <span className="text-admin-primary">*</span>
            </label>
            <DatePicker
              theme="admin"
              value={form.startDate}
              placeholder="Select start date"
              onChange={(date) => {
                updateField('startDate', date);
                if (formErrors.endDate) setFormErrors((prev) => ({ ...prev, endDate: null }));
              }}
            />
            <p className="mt-1 text-[11px] text-admin-muted font-normal leading-tight">Offer start date for campaign timer.</p>
            {formErrors.startDate && <p className="mt-1 text-[11px] font-semibold text-rose-600">{formErrors.startDate}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-admin-text">
              End Date <span className="text-admin-primary">*</span>
            </label>
            <DatePicker
              theme="admin"
              value={form.endDate}
              min={form.startDate || undefined}
              placeholder="Select end date"
              onChange={(date) => updateField('endDate', date)}
            />
            <p className="mt-1 text-[11px] text-admin-muted font-normal leading-tight">Expiration date when offer closes.</p>
            {formErrors.endDate && <p className="mt-1 text-[11px] font-semibold text-rose-600">{formErrors.endDate}</p>}
          </div>
          <TextField
            label="Priority"
            type="number"
            description="Display ranking (higher priority appears top)."
            value={form.priority}
            onChange={(e) => updateField('priority', Number(e.target.value))}
          />
          <SelectField label="Status" description="Publication state on public specials page." value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <div className="md:col-span-2">
            <CheckboxField
              label="Active featured offer"
              description="Displays as the main active festival banner on the homepage."
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
          </div>
          <button type="submit" disabled={saving} className="rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60 md:col-span-2">
            {saving ? <ButtonLoader /> : 'Save Offer'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Offer"
        message="This will permanently delete this festival offer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
