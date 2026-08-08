import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  ClipboardList,
  Search,
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  MessageCircle,
  Printer,
  Share2,
  Download,
} from 'lucide-react';
import { ordersApi, productsApi, getDashboard } from '../services/adminApi';
import { sendInvoiceViaWhatsApp } from '../../utils/whatsapp';
import { useToast } from '../components/ToastProvider';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import ButtonLoader from '../../components/loading/ButtonLoader';
import { TextField, TextAreaField, SelectField } from '../components/FormField';
import DatePicker from '../../components/DatePicker';
import ThemedSelect from '../../components/ThemedSelect';

// Soft pastel palette matching the pink admin theme — one entry per status,
// used for both the status badge and its matching summary card.
const ORDER_STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  READY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// Tailwind's scanner needs literal class strings, so each summary card's
// icon/badge tint is looked up here rather than built with string
// interpolation (which the CSS build would silently miss).
const STAT_CARDS = [
  { key: '', label: 'Total Orders', icon: ClipboardList, iconClass: 'bg-admin-primary/10 text-admin-primary', badgeClass: 'bg-admin-primary/10 text-admin-primary' },
  { key: 'PENDING', label: 'Pending', icon: Clock, iconClass: 'bg-amber-100 text-amber-600', badgeClass: 'bg-amber-100 text-amber-700' },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat, iconClass: 'bg-blue-100 text-blue-600', badgeClass: 'bg-blue-100 text-blue-700' },
  { key: 'READY', label: 'Ready', icon: PackageCheck, iconClass: 'bg-purple-100 text-purple-600', badgeClass: 'bg-purple-100 text-purple-700' },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle, iconClass: 'bg-red-100 text-red-600', badgeClass: 'bg-red-100 text-red-700' },
];

function OrderStatCard({ card, value, active, onSelect }) {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(card.key)}
      className={`flex items-center gap-3 rounded-admin border bg-admin-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-admin-primary ring-2 ring-admin-primary/25' : 'border-admin-border'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-admin-text">{value ?? 0}</p>
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${card.badgeClass}`}>{card.label}</span>
      </div>
    </button>
  );
}

// Computed purely from pickupDatetime — not a stored field — so the drawer's
// "Reminder" line reuses the exact urgency logic already established by the
// Dashboard's Order Reminders widget instead of inventing a second scheme.
function getReminder(pickupDatetime, status) {
  if (status === 'DELIVERED' || status === 'CANCELLED') return null;
  const diffMs = new Date(pickupDatetime).getTime() - Date.now();
  if (diffMs < 0) return { text: 'Delivery time has passed', urgent: true };
  const hours = diffMs / (1000 * 60 * 60);
  if (hours <= 1) return { text: 'Due within the hour', urgent: true };
  if (hours <= 24) return { text: `Due in ${Math.round(hours)} hour(s)`, urgent: false };
  return { text: `Due in ${Math.round(hours / 24)} day(s)`, urgent: false };
}

function ReminderBanner({ order }) {
  const reminder = getReminder(order.pickupDatetime, order.status);
  if (!reminder) return null;
  return (
    <div className={`rounded-2xl p-3 text-sm font-semibold ${reminder.urgent ? 'bg-admin-danger/10 text-admin-danger' : 'bg-admin-primary/10 text-admin-primary'}`}>
      ⏰ {reminder.text}
    </div>
  );
}

const PAYMENT_STATUS_STYLES = {
  PENDING: 'bg-orange-100 text-orange-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  REFUNDED: 'bg-slate-200 text-slate-700',
};

const CUSTOM_CAKE_OPTION = 'Custom Cake';

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

function splitDatetimeLocal(value) {
  const [datePart, timePart] = (value || '').split('T');
  return { date: datePart || '', time: timePart || '' };
}

function combineDatetimeLocal(date, time) {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

function ProductCombobox({ value, onChange, products }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => setQuery(value || ''), [value]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const options = useMemo(() => {
    const names = [CUSTOM_CAKE_OPTION, ...products.map((p) => p.name)];
    if (!query.trim()) return names;
    const q = query.trim().toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [products, query]);

  function selectOption(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-soft/50" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Search products or pick Custom Cake…"
          className="w-full rounded-2xl border border-blush bg-white py-2.5 pl-9 pr-3 text-sm text-cocoa"
        />
      </div>
      {open && options.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-blush/70 bg-white p-1.5 shadow-lg">
          {options.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectOption(name)}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-blush-soft ${
                name === CUSTOM_CAKE_OPTION ? 'font-semibold text-rose-deep' : 'text-cocoa'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  productName: '',
  weight: '',
  flavour: '',
  quantity: 1,
  totalAmount: '',
  discount: 0,
  advancePaid: 0,
  orderType: 'PICKUP',
  pickupDatetime: '',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  address: '',
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
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const productNameOptions = useMemo(() => Array.from(new Set(products.map((p) => p.name))).sort(), [products]);
  const [orderStats, setOrderStats] = useState(null);

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const { showToast } = useToast();

  const [pageSize, setPageSize] = useState(10);

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
        customerName: customerNameFilter || undefined,
        phone: phoneFilter || undefined,
        product: productFilter || undefined,
        createdDate: createdDateFilter || undefined,
        minAmount: minAmountFilter || undefined,
        maxAmount: maxAmountFilter || undefined,
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
  }, [
    page,
    pageSize,
    search,
    statusFilter,
    paymentFilter,
    dateFilter,
    customerNameFilter,
    phoneFilter,
    productFilter,
    createdDateFilter,
    minAmountFilter,
    maxAmountFilter,
  ]);

  useEffect(() => {
    productsApi.list({ page: 1, pageSize: 100 }).then((data) => setProducts(data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    getDashboard().then((data) => setOrderStats(data.orders)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!viewing) {
      setTimeline([]);
      return;
    }
    setTimelineLoading(true);
    ordersApi
      .getTimeline(viewing.id)
      .then((data) => setTimeline(data.events))
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?.id]);

  function handlePageSizeChange(size) {
    setPageSize(size);
    setPage(1);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ open: true, mode: 'create', id: null });
  }

  function openEdit(item) {
    setForm({
      customerName: item.customerName,
      phone: item.phone,
      productName: item.productName,
      weight: item.weight || '',
      flavour: item.flavour || '',
      quantity: item.quantity,
      totalAmount: item.totalAmount,
      discount: item.discount || 0,
      advancePaid: item.advancePaid,
      orderType: item.orderType,
      pickupDatetime: toDatetimeLocalValue(item.pickupDatetime),
      status: item.status,
      paymentStatus: item.paymentStatus,
      address: item.address || '',
      notes: item.notes || '',
    });
    setError('');
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  const remainingAmount = Math.max(
    0,
    (Number(form.totalAmount) || 0) - (Number(form.discount) || 0) - (Number(form.advancePaid) || 0),
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        totalAmount: Number(form.totalAmount),
        discount: Number(form.discount) || 0,
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

  async function ensureInvoice(item) {
    if (item.invoicePath) return item;
    try {
      const { order } = await ordersApi.generateInvoice(item.id);
      showToast('Invoice generated.', 'success');
      load();
      if (viewing?.id === item.id) setViewing(order);
      return order;
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    }
  }

  // The invoice URL points at the backend origin, which normally differs
  // from the admin panel's own origin — a plain <a download> is silently
  // ignored by browsers for cross-origin links. Fetching the file as a blob
  // and downloading *that* (a same-origin blob: URL) is what actually forces
  // a save-to-disk regardless of origin.
  async function downloadFile(url, filename) {
    try {
      const response = await fetch(url, { credentials: 'include' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleInvoiceDownload(item) {
    const order = await ensureInvoice(item);
    if (order) downloadFile(order.invoicePath, `${order.orderNumber.replace('ORD-', 'INV-')}.pdf`);
  }

  async function handlePrintInvoice(item) {
    const order = await ensureInvoice(item);
    if (!order) return;
    const win = window.open(order.invoicePath, '_blank');
    if (!win) return;
    // Best-effort: Chromium/Firefox's built-in PDF viewer responds to a
    // same-origin window.print() call once the document has painted. Some
    // browsers/viewers ignore it silently — the viewer's own toolbar still
    // has a print icon the admin can use as a fallback either way.
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* fall back to the PDF viewer's own print control */
      }
    }, 700);
  }

  async function handleShareInvoice(item) {
    const order = await ensureInvoice(item);
    if (!order) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${order.orderNumber}`,
          text: `Invoice for ${order.customerName}`,
          url: order.invoicePath,
        });
      } catch {
        /* user dismissed the native share sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(order.invoicePath);
        showToast('Invoice link copied to clipboard.', 'success');
      } catch {
        showToast('Could not copy invoice link.', 'error');
      }
    }
  }

  async function handleInvoiceWhatsApp(item) {
    const order = await ensureInvoice(item);
    if (!order) return;
    sendInvoiceViaWhatsApp({ customerName: order.customerName, phone: order.phone, invoiceUrl: order.invoicePath });
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

      {orderStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STAT_CARDS.map((card) => (
            <OrderStatCard
              key={card.key || 'total'}
              card={card}
              value={card.key === '' ? orderStats.total : orderStats[card.key.toLowerCase()]}
              active={statusFilter === card.key}
              onSelect={(key) => {
                setStatusFilter((prev) => (key === '' ? '' : prev === key ? '' : key));
                setPage(1);
              }}
            />
          ))}
        </div>
      )}

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, phone, order #…" />
        <ThemedSelect
          theme="admin"
          className="w-44"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[{ value: '', label: 'All Statuses' }, ...Object.keys(ORDER_STATUS_STYLES).map((s) => ({ value: s, label: s }))]}
        />
        <DatePicker
          theme="admin"
          className="w-60"
          value={dateFilter}
          onChange={(v) => {
            setDateFilter(v);
            setPage(1);
          }}
          placeholder="Delivery date"
        />
        <button
          type="button"
          onClick={() => setShowMoreFilters((v) => !v)}
          className="rounded-xl border border-admin-border px-3 py-2.5 text-sm font-semibold text-admin-primary hover:bg-admin-bg"
        >
          {showMoreFilters ? 'Fewer Filters' : 'More Filters'}
        </button>
      </div>

      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={customerNameFilter}
            onChange={(e) => {
              setCustomerNameFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Customer name"
            className="rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
          />
          <input
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Phone"
            className="rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
          />
          <ThemedSelect
            theme="admin"
            className="w-48"
            value={productFilter}
            onChange={(v) => {
              setProductFilter(v);
              setPage(1);
            }}
            placeholder="All Products"
            options={[{ value: '', label: 'All Products' }, ...productNameOptions.map((name) => ({ value: name, label: name }))]}
          />
          <ThemedSelect
            theme="admin"
            className="w-44"
            value={paymentFilter}
            onChange={(v) => {
              setPaymentFilter(v);
              setPage(1);
            }}
            options={[{ value: '', label: 'All Payments' }, ...Object.keys(PAYMENT_STATUS_STYLES).map((s) => ({ value: s, label: s }))]}
          />
          <label className="flex items-center gap-2 text-sm text-admin-muted">
            Created on
            <DatePicker
              theme="admin"
              className="w-60"
              value={createdDateFilter}
              onChange={(v) => {
                setCreatedDateFilter(v);
                setPage(1);
              }}
              placeholder="Created date"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={minAmountFilter}
              onChange={(e) => {
                setMinAmountFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Min ₹"
              className="w-24 rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
            />
            <span className="text-admin-muted">–</span>
            <input
              type="number"
              min="0"
              value={maxAmountFilter}
              onChange={(e) => {
                setMaxAmountFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Max ₹"
              className="w-24 rounded-xl border border-admin-border bg-admin-card px-3 py-2.5 text-sm text-admin-text"
            />
          </div>
          {(customerNameFilter || phoneFilter || productFilter || paymentFilter || createdDateFilter || minAmountFilter || maxAmountFilter) && (
            <button
              type="button"
              onClick={() => {
                setCustomerNameFilter('');
                setPhoneFilter('');
                setProductFilter('');
                setPaymentFilter('');
                setCreatedDateFilter('');
                setMinAmountFilter('');
                setMaxAmountFilter('');
                setPage(1);
              }}
              className="text-sm font-semibold text-admin-primary hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      )}

      <DataTable
        theme="admin"
        sticky
        zebra
        spacious
        actionsPosition="start"
        minWidthClass="min-w-0"
        loading={loading}
        items={items}
        renderEmpty={
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            message="Log an order taken over WhatsApp, phone, or in person."
            actionLabel="Create First Order"
            onAction={openCreate}
          />
        }
        columns={[
          {
            key: 'orderNumber',
            label: 'Invoice No',
            render: (i) =>
              i.invoicePath ? (
                <span className="font-semibold text-admin-text">{i.orderNumber.replace('ORD-', 'INV-')}</span>
              ) : (
                <span className="text-admin-muted">—</span>
              ),
          },
          {
            key: 'customerName',
            label: 'Customer',
            render: (i) => (
              <div>
                <p className="font-semibold text-admin-text">{i.customerName}</p>
                <p className="text-xs text-admin-muted">{i.phone}</p>
              </div>
            ),
          },
          {
            key: 'productName',
            label: 'Cake / Product',
            render: (i) => (
              <div>
                <p className="text-admin-text">{i.productName}</p>
                {i.weight && <p className="text-xs text-admin-muted">{i.weight}</p>}
              </div>
            ),
          },
          {
            key: 'pickupDatetime',
            label: 'Delivery Date & Time',
            render: (i) => (
              <div>
                <p className="text-admin-text">
                  {new Date(i.pickupDatetime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-admin-muted">
                  {new Date(i.pickupDatetime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            ),
          },
          { key: 'totalAmount', label: 'Amount', render: (i) => `₹${Number(i.totalAmount).toFixed(2)}` },
          { key: 'status', label: 'Status', render: (i) => <OrderStatusBadge status={i.status} /> },
        ]}
        renderActions={(item) => (
          <>
            <button
              type="button"
              title="View"
              onClick={() => setViewing(item)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Edit"
              onClick={() => openEdit(item)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Generate Invoice"
              onClick={() => handleInvoiceDownload(item)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
            >
              <FileText className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Send WhatsApp"
              onClick={() => handleInvoiceWhatsApp(item)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-success hover:bg-admin-bg"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Print"
              onClick={() => handlePrintInvoice(item)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => setConfirmDelete(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      />

      <Pagination theme="admin" page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />

      <Modal open={modal.open} title={modal.mode === 'create' ? 'New Order' : 'Edit Order'} onClose={() => setModal({ ...modal, open: false })} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger md:col-span-2">{error}</p>}
          <TextField label="Customer Name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <TextField label="Phone Number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">
              Cake / Product <span className="text-rose-deep">*</span>
            </span>
            <ProductCombobox
              value={form.productName}
              onChange={(name) => setForm({ ...form, productName: name })}
              products={products}
            />
          </label>
          <TextField label="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 1kg" />
          <TextField label="Flavour" value={form.flavour} onChange={(e) => setForm({ ...form, flavour: e.target.value })} placeholder="e.g. Chocolate" />
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
            label="Discount"
            type="number"
            min="0"
            step="0.01"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
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
          <TextAreaField
            label="Delivery Address"
            containerClassName="md:col-span-2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <SelectField label="Order Type" value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })}>
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
          </SelectField>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-cocoa">
              Pickup / Delivery Date &amp; Time <span className="text-rose-deep">*</span>
            </span>
            <DatePicker
              theme="admin"
              value={splitDatetimeLocal(form.pickupDatetime).date}
              time={splitDatetimeLocal(form.pickupDatetime).time}
              onChange={(date) =>
                setForm({ ...form, pickupDatetime: combineDatetimeLocal(date, splitDatetimeLocal(form.pickupDatetime).time) })
              }
              onTimeChange={(time) =>
                setForm({ ...form, pickupDatetime: combineDatetimeLocal(splitDatetimeLocal(form.pickupDatetime).date, time) })
              }
              placeholder="Select date & time"
            />
          </label>
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
              {saving ? <ButtonLoader /> : 'Save Order'}
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

      <Drawer open={Boolean(viewing)} title={viewing?.orderNumber || 'Order Details'} onClose={() => setViewing(null)}>
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-semibold text-admin-text">{viewing.customerName}</p>
                <p className="flex items-center gap-1.5 text-sm text-admin-muted">
                  <Phone className="h-3.5 w-3.5" /> {viewing.phone}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <OrderStatusBadge status={viewing.status} />
                <PaymentStatusBadge status={viewing.paymentStatus} />
              </div>
            </div>

            <ReminderBanner order={viewing} />

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-admin-bg p-4 text-sm">
              <Field label="Cake / Product" value={viewing.productName} />
              <Field label="Weight" value={viewing.weight || '—'} />
              <Field label="Flavour" value={viewing.flavour || '—'} />
              <Field label="Quantity" value={viewing.quantity} />
              <Field label="Order Type" value={viewing.orderType} />
              <Field label="Pickup/Delivery" value={formatDateTime(viewing.pickupDatetime)} />
            </div>

            {viewing.address && (
              <div className="rounded-2xl bg-admin-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Delivery Address</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-admin-text">{viewing.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-admin-bg p-4 text-sm">
              <Field label="Total Amount" value={`₹${Number(viewing.totalAmount).toFixed(2)}`} />
              <Field label="Discount" value={`₹${Number(viewing.discount || 0).toFixed(2)}`} />
              <Field label="Advance Paid" value={`₹${Number(viewing.advancePaid).toFixed(2)}`} />
              <Field label="Remaining Amount" value={`₹${Number(viewing.remainingAmount).toFixed(2)}`} />
            </div>

            {viewing.notes && (
              <div className="rounded-2xl bg-admin-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Notes</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-admin-text">{viewing.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">Timeline</p>
              {timelineLoading ? (
                <p className="text-sm text-admin-muted">Loading…</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-admin-muted">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-2 border-l border-admin-border pl-4">
                  {timeline.map((event) => (
                    <li key={event.id} className="relative text-sm">
                      <span className="absolute -left-5.25 top-1.5 h-2 w-2 rounded-full bg-admin-primary" />
                      <p className="font-semibold text-admin-text">{event.action.replaceAll('_', ' ')}</p>
                      <p className="text-xs text-admin-muted">
                        {event.adminName} · {formatDateTime(event.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between text-xs text-admin-muted">
              <span>Created {formatDateTime(viewing.createdAt)}</span>
              <span>Updated {formatDateTime(viewing.updatedAt)}</span>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-admin-border pt-4">
              <button
                type="button"
                onClick={() => handleInvoiceDownload(viewing)}
                className="flex items-center gap-2 rounded-xl bg-admin-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-primary-hover"
              >
                <Download className="h-4 w-4" /> {viewing.invoicePath ? 'Download Invoice' : 'Generate Invoice'}
              </button>
              <button
                type="button"
                onClick={() => handleInvoiceWhatsApp(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg"
              >
                <MessageCircle className="h-4 w-4 text-admin-success" /> Send WhatsApp
              </button>
              <button
                type="button"
                onClick={() => handlePrintInvoice(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => handleShareInvoice(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        )}
      </Drawer>

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
