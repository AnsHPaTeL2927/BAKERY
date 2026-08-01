import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { offersApi } from '../services/adminApi';
import DataTable from '../components/DataTable';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import ImageUploader from '../components/ImageUploader';
import { TextField, TextAreaField, SelectField, CheckboxField } from '../components/FormField';

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
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const pageSize = 10;

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
  }, [page, search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setExistingImage(null);
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
    setImageFile(null);
    setExistingImage(item.banner);
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
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

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Offer' : 'Edit Offer'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <ImageUploader
              label="Banner Image"
              hint="1920x800"
              initialUrl={existingImage}
              required={modal.mode === 'create'}
              onChange={setImageFile}
            />
          </div>
          <TextField label="Festival" required value={form.festival} onChange={(e) => setForm({ ...form, festival: e.target.value })} />
          <TextField label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextAreaField
            label="Description"
            required
            containerClassName="md:col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField label="Discount Text" required value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          <TextField label="CTA Text" required value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
          <TextField
            label="Start Date"
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <TextField
            label="End Date"
            type="date"
            required
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <TextField
            label="Priority"
            type="number"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
          />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="LIVE">Live</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </SelectField>
          <CheckboxField
            label="Active (shown as the current featured offer)"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <button type="submit" disabled={saving} className="rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60 md:col-span-2">
            {saving ? 'Saving…' : 'Save Offer'}
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
