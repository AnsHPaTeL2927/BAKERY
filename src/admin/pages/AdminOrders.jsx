import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Phone, Truck, Store } from 'lucide-react';
import { ordersApi } from '../services/adminApi';
import { useToast } from '../components/ToastProvider';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import { TextField, TextAreaField, SelectField } from '../components/FormField';

const ORDER_STATUS_STYLES = {
  PENDING: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  READY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_STYLES = {
  PENDING: 'bg-orange-100 text-orange-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

function OrderStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLES[status] || ''}`}>
      {status}
    </span>
  );
}

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  productName: '',
  quantity: 1,
  totalAmount: '',
  advancePaid: 0,
  orderType: 'PICKUP',
  pickupDatetime: '',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  notes: '',
};

export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { showToast } = useToast();

  const pageSize = 10;

  async function load() {
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page,
        pageSize,
        search,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        date: dateFilter || undefined,
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
  }, [page, search, statusFilter, paymentFilter, dateFilter]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({
      customerName: item.customerName,
      phone: item.phone,
      productName: item.productName,
      quantity: item.quantity,
      totalAmount: item.totalAmount,
      advancePaid: item.advancePaid,
      orderType: item.orderType,
      pickupDatetime: toDatetimeLocalValue(item.pickupDatetime),
      status: item.status,
      paymentStatus: item.paymentStatus,
      notes: item.notes || '',
    });
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  const remainingAmount = Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.advancePaid) || 0));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        totalAmount: Number(form.totalAmount),
        advancePaid: Number(form.advancePaid) || 0,
      };

      if (modal.mode === 'create') {
        await ordersApi.create(payload);
        showToast('Order created.', 'success');
      } else {
        await ordersApi.update(modal.id, payload);
        showToast('Order updated.', 'success');
      }
      setModal({ open: false, mode: 'create', id: null });
      load();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await ordersApi.remove(confirmDelete);
      showToast('Order deleted.', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Operations</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Orders</h1>
          <p className="mt-1 text-sm text-admin-muted">Log orders taken over WhatsApp, phone, or in person.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-admin-primary px-5 py-2.5 font-semibold text-white hover:bg-admin-primary-hover"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, phone, order #…" />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
        >
          <option value="">All Statuses</option>
          {Object.keys(ORDER_STATUS_STYLES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
        >
          <option value="">All Payments</option>
          {Object.keys(PAYMENT_STATUS_STYLES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
        />
      </div>

      <DataTable
        loading={loading}
        items={items}
        emptyLabel="No orders logged yet."
        columns={[
          { key: 'orderNumber', label: 'Order ID' },
          { key: 'customerName', label: 'Customer' },
          { key: 'phone', label: 'Phone' },
          { key: 'productName', label: 'Product' },
          { key: 'createdAt', label: 'Order Date', render: (i) => new Date(i.createdAt).toLocaleDateString() },
          {
            key: 'pickupDatetime',
            label: 'Pickup/Delivery',
            render: (i) => (
              <span className="flex items-center gap-1.5">
                {i.orderType === 'DELIVERY' ? <Truck className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                {formatDateTime(i.pickupDatetime)}
              </span>
            ),
          },
          { key: 'totalAmount', label: 'Amount', render: (i) => `₹${Number(i.totalAmount).toFixed(2)}` },
          { key: 'paymentStatus', label: 'Payment', render: (i) => <PaymentStatusBadge status={i.paymentStatus} /> },
          { key: 'status', label: 'Status', render: (i) => <OrderStatusBadge status={i.status} /> },
        ]}
        renderActions={(item) => (
          <>
            <button
              type="button"
              onClick={() => setViewing(item)}
              className="rounded-full border border-blush px-3 py-1 text-xs font-semibold text-cocoa hover:bg-blush-soft"
            >
              View
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

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Order' : 'Edit Order'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <TextField label="Customer Name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <TextField label="Phone Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Cake / Product" required value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
          <TextField
            label="Quantity"
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <TextField
            label="Total Amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
          />
          <TextField
            label="Advance Paid"
            type="number"
            min="0"
            step="0.01"
            value={form.advancePaid}
            onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
          />
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">Remaining Amount</span>
            <p className="rounded-2xl border border-blush bg-blush-soft/40 p-3 text-sm font-semibold text-cocoa">
              ₹{remainingAmount.toFixed(2)}
            </p>
          </div>
          <SelectField label="Order Type" value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })}>
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
          </SelectField>
          <TextField
            label="Pickup / Delivery Date & Time"
            type="datetime-local"
            required
            value={form.pickupDatetime}
            onChange={(e) => setForm({ ...form, pickupDatetime: e.target.value })}
          />
          <SelectField label="Order Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.keys(ORDER_STATUS_STYLES).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>
          <SelectField label="Payment Status" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
            {Object.keys(PAYMENT_STATUS_STYLES).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Notes"
            containerClassName="md:col-span-2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex gap-3 md:col-span-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-rose py-3 font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Order'}
            </button>
            <button
              type="button"
              onClick={() => setModal({ ...modal, open: false })}
              className="flex-1 rounded-2xl border border-blush py-3 font-semibold text-cocoa hover:bg-blush-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10">
          <div className="w-full max-w-lg rounded-admin border border-admin-border bg-admin-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-primary">{viewing.orderNumber}</p>
                <p className="font-display text-lg font-semibold text-admin-text">{viewing.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full p-1.5 text-admin-muted hover:bg-admin-bg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm text-admin-text">
              <Phone className="h-4 w-4 text-admin-primary" /> {viewing.phone}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl bg-admin-bg p-4 text-sm">
              <Field label="Cake / Product" value={viewing.productName} />
              <Field label="Quantity" value={viewing.quantity} />
              <Field label="Total Amount" value={`₹${Number(viewing.totalAmount).toFixed(2)}`} />
              <Field label="Advance Paid" value={`₹${Number(viewing.advancePaid).toFixed(2)}`} />
              <Field label="Remaining Amount" value={`₹${Number(viewing.remainingAmount).toFixed(2)}`} />
              <Field label="Order Type" value={viewing.orderType} />
              <Field label="Pickup/Delivery" value={formatDateTime(viewing.pickupDatetime)} />
              <Field label="Order Status" value={<OrderStatusBadge status={viewing.status} />} />
              <Field label="Payment Status" value={<PaymentStatusBadge status={viewing.paymentStatus} />} />
            </div>

            {viewing.notes && (
              <div className="mt-4 rounded-2xl bg-admin-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-admin-text">{viewing.notes}</p>
              </div>
            )}

            <div className="mt-4 flex justify-between text-xs text-admin-muted">
              <span>Created {formatDateTime(viewing.createdAt)}</span>
              <span>Updated {formatDateTime(viewing.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Order"
        message="This will permanently delete this order record."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-admin-text">{value}</p>
    </div>
  );
}
