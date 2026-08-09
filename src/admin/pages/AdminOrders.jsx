import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  ClipboardList,
  Search,
  Clock,
  BadgeCheck,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Eye,
  MessageCircle,
  Printer,
  Share2,
  Download,
  ChevronDown,
  Check,
  Truck,
  RotateCcw,
  User,
  Cake,
  CalendarClock,
  IndianRupee,
  StickyNote,
  SlidersHorizontal,
  FileText,
  MoreHorizontal,
  Store,
} from 'lucide-react';
import { ordersApi, productsApi, getDashboard } from '../services/adminApi';
import {
  openWhatsApp,
  getWhatsAppPreference,
  getWhatsAppTemplate,
  renderWhatsAppTemplate,
  normalizePhone,
} from '../../utils/whatsapp';
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
import { usePortalDropdown } from '../../hooks/usePortalDropdown';
import useIsMobile from '../hooks/useIsMobile';
import BottomSheet from '../components/BottomSheet';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';

const ORDER_STATUS_CONFIG = {
  PENDING: { label: 'Pending', badgeClass: 'bg-amber-100 text-amber-700', icon: Clock },
  CONFIRMED: { label: 'Confirmed', badgeClass: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', badgeClass: 'bg-purple-100 text-purple-700', icon: ChefHat },
  READY: { label: 'Ready', badgeClass: 'bg-indigo-100 text-indigo-700', icon: PackageCheck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', badgeClass: 'bg-orange-100 text-orange-700', icon: Truck },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', badgeClass: 'bg-rose-100 text-rose-700', icon: XCircle },
  DELIVERED: { label: 'Completed', badgeClass: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const PAYMENT_STATUS_CONFIG = {
  UNPAID: { label: 'Unpaid', badgeClass: 'bg-rose-100 text-rose-700' },
  PARTIALLY_PAID: { label: 'Partially Paid', badgeClass: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Paid', badgeClass: 'bg-emerald-100 text-emerald-700' },
  REFUNDED: { label: 'Refunded', badgeClass: 'bg-purple-100 text-purple-700' },
  PENDING: { label: 'Unpaid', badgeClass: 'bg-rose-100 text-rose-700' },
  PARTIAL: { label: 'Partially Paid', badgeClass: 'bg-amber-100 text-amber-700' },
};

const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  UPI: 'UPI / Online',
  CARD: 'Credit / Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

// Order follows the actual lifecycle: Pending → Confirmed → Preparing → Ready → Completed, with Cancelled as the separate terminal state.
const STAT_CARDS = [
  { key: '', label: 'Total Orders', icon: ClipboardList, iconClass: 'bg-admin-primary/10 text-admin-primary', badgeClass: 'bg-admin-primary/10 text-admin-primary' },
  { key: 'PENDING', label: 'Pending', icon: Clock, iconClass: 'bg-amber-100 text-amber-600', badgeClass: 'bg-amber-100 text-amber-700' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: BadgeCheck, iconClass: 'bg-blue-100 text-blue-600', badgeClass: 'bg-blue-100 text-blue-700' },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat, iconClass: 'bg-purple-100 text-purple-600', badgeClass: 'bg-purple-100 text-purple-700' },
  { key: 'READY', label: 'Ready', icon: PackageCheck, iconClass: 'bg-indigo-100 text-indigo-600', badgeClass: 'bg-indigo-100 text-indigo-700' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { key: 'CANCELLED', label: 'Cancelled', icon: XCircle, iconClass: 'bg-rose-100 text-rose-600', badgeClass: 'bg-rose-100 text-rose-700' },
];

const ORDER_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'REFUNDED', label: 'Refunded' },
];

// Pill/chip toggle group for the mobile Filters sheet — replaces the desktop
// dropdown selects for the two status filters there, matching the design's
// tap-to-select chips (each option tinted with its own status color when active).
function FilterChipGroup({ options, value, onChange, configMap }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        const activeClass = opt.value ? configMap[opt.value]?.badgeClass || 'bg-admin-primary/10 text-admin-primary' : 'bg-admin-primary/10 text-admin-primary';
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
              active ? activeClass : 'border border-admin-border bg-admin-card text-admin-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function OrderStatCard({ card, value, active, onSelect }) {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(card.key)}
      className={`flex items-center gap-3 rounded-2xl border bg-admin-card p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-admin-primary ring-2 ring-admin-primary/25' : 'border-admin-border'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="overflow-hidden text-2xl font-bold tabular-nums text-admin-text">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={value ?? 0}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {value ?? 0}
            </motion.p>
          </AnimatePresence>
        </div>
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${card.badgeClass}`}>{card.label}</span>
      </div>
    </button>
  );
}

function OrderStatCardSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-2xl border border-admin-border bg-admin-card p-4">
      <span className="h-10 w-10 shrink-0 rounded-xl bg-admin-bg" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-6 w-10 rounded-md bg-admin-bg" />
        <div className="h-4 w-16 rounded-full bg-admin-bg" />
      </div>
    </div>
  );
}

function OrderStatsError({ onRetry }) {
  return (
    <div className="col-span-2 flex items-center justify-between gap-3 rounded-2xl border border-admin-danger/30 bg-admin-danger/10 p-4 text-sm text-admin-danger sm:col-span-3 md:col-span-4 xl:col-span-7">
      <span className="font-semibold">— Unable to load order statistics.</span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-xl border border-admin-danger/40 px-3 py-1.5 text-xs font-semibold hover:bg-admin-danger/10"
      >
        Retry
      </button>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const cfg = ORDER_STATUS_CONFIG[status] || { label: status, badgeClass: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}>
      {cfg.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] || { label: status, badgeClass: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}>
      {cfg.label}
    </span>
  );
}

function getNextStatusOptions(order) {
  const status = order.status;
  const isDelivery = order.orderType === 'DELIVERY';

  switch (status) {
    case 'PENDING':
      return [
        { status: 'CONFIRMED', label: 'Confirm Order', actionText: 'Mark Confirmed' },
        { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
      ];
    case 'CONFIRMED':
      return [
        { status: 'PREPARING', label: 'Start Preparing', actionText: 'Start Preparing' },
        { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
      ];
    case 'PREPARING':
      return [
        { status: 'READY', label: 'Mark Ready', actionText: 'Mark Ready' },
        { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
      ];
    case 'READY':
      if (isDelivery) {
        return [
          { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', actionText: 'Set Out for Delivery' },
          { status: 'COMPLETED', label: 'Mark Completed', actionText: 'Mark Completed' },
          { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
        ];
      }
      return [
        { status: 'COMPLETED', label: 'Mark Completed', actionText: 'Mark Completed' },
        { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
      ];
    case 'OUT_FOR_DELIVERY':
      return [
        { status: 'COMPLETED', label: 'Mark Completed', actionText: 'Mark Completed' },
        { status: 'CANCELLED', label: 'Cancel Order', actionText: 'Cancel Order', danger: true },
      ];
    default:
      return [];
  }
}

function QuickStatusDropdown({ order, onRequestChange, loadingId }) {
  const nextOptions = useMemo(() => getNextStatusOptions(order), [order]);
  const isLoading = loadingId === order.id;
  const isMobile = useIsMobile();

  const { triggerRef, dropdownRef, open, toggle, close, portalStyle, openUpward } =
    usePortalDropdown({ estimatedHeight: nextOptions.length * 40 + 40, estimatedWidth: 180 });

  if (nextOptions.length === 0) {
    return <OrderStatusBadge status={order.status} />;
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={isLoading}
      onClick={toggle}
      className="group inline-flex items-center gap-1 focus:outline-none transition-transform hover:scale-105"
      title="Click to quick-change status"
    >
      <OrderStatusBadge status={order.status} />
      {isLoading ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 text-admin-muted transition-transform group-hover:text-admin-text" />
      )}
    </button>
  );

  const optionButtons = nextOptions.map((opt) => (
    <button
      key={opt.status}
      type="button"
      onClick={() => {
        close();
        onRequestChange(order, opt.status, opt.label);
      }}
      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-colors sm:py-1.5 sm:text-xs ${
        opt.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-admin-text hover:bg-admin-bg'
      }`}
    >
      <span>{opt.label}</span>
    </button>
  ));

  if (isMobile) {
    return (
      <div className="inline-block">
        {trigger}
        <BottomSheet open={open} title="Change Order Status" onClose={close}>
          <div className="space-y-1">{optionButtons}</div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      {trigger}
      {open && createPortal(
        <div ref={dropdownRef} style={portalStyle}>
          <AnimatePresence>
            <motion.div
              key="quick-status-panel"
              initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="rounded-2xl border border-admin-border bg-admin-card p-1.5 shadow-xl shadow-cocoa/10"
            >
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-admin-muted border-b border-admin-border/50 mb-1">
                Next Action
              </div>
              {optionButtons}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}

function PaymentStatusDropdown({ order, onUpdate }) {
  const options = [
    { key: 'UNPAID', label: 'Unpaid' },
    { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { key: 'PAID', label: 'Paid' },
    { key: 'REFUNDED', label: 'Refunded' },
  ];
  const isMobile = useIsMobile();

  const { triggerRef, dropdownRef, open, toggle, close, portalStyle, openUpward } =
    usePortalDropdown({ estimatedHeight: options.length * 40 + 16, estimatedWidth: 160 });

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      className="group inline-flex items-center gap-1 focus:outline-none transition-transform hover:scale-105"
      title="Click to update payment status"
    >
      <PaymentStatusBadge status={order.paymentStatus} />
      <ChevronDown className="h-3.5 w-3.5 text-admin-muted transition-transform group-hover:text-admin-text" />
    </button>
  );

  const optionButtons = options.map((opt) => (
    <button
      key={opt.key}
      type="button"
      onClick={() => {
        onUpdate(order, opt.key);
        close();
      }}
      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-colors sm:py-1.5 sm:text-xs ${
        order.paymentStatus === opt.key ? 'bg-admin-primary/10 text-admin-primary font-bold' : 'text-admin-text hover:bg-admin-bg'
      }`}
    >
      <span>{opt.label}</span>
      {order.paymentStatus === opt.key && <Check className="h-3.5 w-3.5 shrink-0 text-admin-primary" />}
    </button>
  ));

  if (isMobile) {
    return (
      <div className="inline-block">
        {trigger}
        <BottomSheet open={open} title="Update Payment Status" onClose={close}>
          <div className="space-y-1">{optionButtons}</div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      {trigger}
      {open && createPortal(
        <div ref={dropdownRef} style={portalStyle}>
          <AnimatePresence>
            <motion.div
              key="payment-status-panel"
              initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="rounded-2xl border border-admin-border bg-admin-card p-1.5 shadow-xl shadow-cocoa/10"
            >
              {optionButtons}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}

// Overflow "more" menu on the mobile order card footer — Print/Share/Delete,
// the actions that don't fit as a visible footer icon. Reuses the same
// usePortalDropdown + BottomSheet pattern as QuickStatusDropdown above.
function OrderCardMoreMenu({ order, onPrint, onShare, onDelete }) {
  const isMobile = useIsMobile();
  const { triggerRef, dropdownRef, open, toggle, close, portalStyle, openUpward } =
    usePortalDropdown({ estimatedHeight: 3 * 44 + 16, estimatedWidth: 170 });

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      title="More actions"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-admin-border text-admin-text"
    >
      <MoreHorizontal className="h-4.5 w-4.5" />
    </button>
  );

  const items = [
    { label: 'Print invoice', onClick: () => onPrint(order) },
    { label: 'Share invoice', onClick: () => onShare(order) },
    { label: 'Delete order', onClick: () => onDelete(order.id), danger: true },
  ];

  const optionButtons = items.map((it) => (
    <button
      key={it.label}
      type="button"
      onClick={() => {
        close();
        it.onClick();
      }}
      className={`flex w-full items-center rounded-xl px-2.5 py-2.5 text-left text-sm font-semibold sm:py-1.5 sm:text-xs ${
        it.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-admin-text hover:bg-admin-bg'
      }`}
    >
      {it.label}
    </button>
  ));

  if (isMobile) {
    return (
      <div className="inline-block" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        {trigger}
        <BottomSheet open={open} title="Order actions" onClose={close}>
          <div className="space-y-1">{optionButtons}</div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="relative inline-block" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      {trigger}
      {open &&
        createPortal(
          <div ref={dropdownRef} style={portalStyle}>
            <AnimatePresence>
              <motion.div
                key="order-more-menu"
                initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="rounded-2xl border border-admin-border bg-admin-card p-1.5 shadow-xl shadow-cocoa/10"
              >
                {optionButtons}
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </div>
  );
}

function OrderLifecycleTimeline({ order }) {
  const steps = [
    { key: 'PENDING', label: 'Created' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY', label: 'Ready' },
    ...(order?.orderType === 'DELIVERY' ? [{ key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' }] : []),
    { key: 'COMPLETED', label: 'Completed' },
  ];

  if (order?.status === 'CANCELLED') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm font-semibold text-rose-700">
        ❌ Order has been Cancelled
      </div>
    );
  }

  const orderStatusMap = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    READY: 3,
    OUT_FOR_DELIVERY: order?.orderType === 'DELIVERY' ? 4 : 3,
    COMPLETED: order?.orderType === 'DELIVERY' ? 5 : 4,
    DELIVERED: order?.orderType === 'DELIVERY' ? 5 : 4,
  };

  const currentIndex = orderStatusMap[order?.status] ?? 0;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-admin-muted">Order Lifecycle Progress</p>
      <div className="flex items-center justify-between relative py-2">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-admin-primary text-white shadow-xs'
                    : 'border-2 border-admin-border bg-admin-card text-admin-muted'
                } ${isCurrent ? 'ring-4 ring-admin-primary/20 scale-110' : ''}`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold text-center leading-tight ${
                  isCurrent ? 'text-admin-primary font-bold' : isDone ? 'text-admin-text' : 'text-admin-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso) {
  if (!iso) return '—';
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

const CUSTOM_CAKE_OPTION = 'Custom Cake';

function ProductCombobox({ value, onChange, onSelectProduct, products, error }) {
  const [query, setQuery] = useState(value || '');
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});

  useEffect(() => setQuery(value || ''), [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function calcPanelPos() {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const panelH = 250;
    const vpH = window.innerHeight;
    const spaceBelow = vpH - rect.bottom;
    const goUp = spaceBelow < panelH + 12 && rect.top >= panelH + 12;
    let top = goUp ? rect.top - panelH - 6 : rect.bottom + 4;
    top = Math.max(8, Math.min(top, vpH - panelH - 8));
    setPanelStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 9999,
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  }, [products, query]);

  function handleSelect(p) {
    if (p === CUSTOM_CAKE_OPTION) {
      setQuery(CUSTOM_CAKE_OPTION);
      onChange(CUSTOM_CAKE_OPTION);
      onSelectProduct?.(null);
    } else {
      setQuery(p.name);
      onChange(p.name);
      onSelectProduct?.(p);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => { calcPanelPos(); setOpen(true); }}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            calcPanelPos();
            setOpen(true);
          }}
          placeholder="Search product by name or category…"
          className={`w-full rounded-xl border bg-admin-card py-2.5 pl-9 pr-3 text-sm text-admin-text shadow-sm transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-admin-border focus:border-admin-primary focus:ring-admin-primary/20'
          }`}
        />
      </div>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle}>
          <div className="max-h-60 overflow-y-auto rounded-2xl border border-admin-border bg-admin-card p-1.5 shadow-2xl shadow-cocoa/10">
            <button
              type="button"
              onClick={() => handleSelect(CUSTOM_CAKE_OPTION)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-admin-bg transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 font-bold text-xs">
                🎂
              </div>
              <div>
                <p className="text-sm font-bold text-rose-600">{CUSTOM_CAKE_OPTION}</p>
                <p className="text-xs text-admin-muted">Custom bakery order</p>
              </div>
            </button>

            {filtered.map((p) => {
              const firstPrice = p.priceByWeight ? Object.values(p.priceByWeight)[0] : p.price;
              const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.image;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left hover:bg-admin-bg transition-colors border-t border-admin-border/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {primaryImg ? (
                      <img src={primaryImg} alt="" className="h-9 w-9 rounded-lg object-cover border border-admin-border/50 shrink-0" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-admin-primary/10 text-admin-primary font-bold text-xs">
                        🎂
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-admin-text truncate">{p.name}</p>
                      <p className="text-xs text-admin-muted truncate">{p.category?.name || 'Cakes'}</p>
                    </div>
                  </div>
                  {firstPrice && (
                    <span className="shrink-0 rounded-full bg-admin-primary/10 px-2.5 py-0.5 text-xs font-bold text-admin-primary">
                      ₹{firstPrice}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && query !== CUSTOM_CAKE_OPTION && (
              <p className="p-3 text-center text-xs text-admin-muted">No matching products found.</p>
            )}
          </div>
        </div>,
        document.body
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
  paymentStatus: 'UNPAID',
  paymentMethod: 'CASH',
  address: '',
  notes: '',
};

export default function AdminOrders() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const hasActiveFilters = Boolean(
    search ||
      statusFilter ||
      paymentFilter ||
      orderTypeFilter ||
      dateFilter ||
      customerNameFilter ||
      phoneFilter ||
      productFilter,
  );
  // Powers the mobile filter-sheet trigger's count badge — search has its own
  // visible field on mobile, so it's excluded here (matches the design, which
  // badges only the fields hidden behind the funnel icon).
  const activeSheetFilterCount = [
    statusFilter,
    paymentFilter,
    orderTypeFilter,
    dateFilter,
    customerNameFilter,
    phoneFilter,
    productFilter,
  ].filter(Boolean).length;
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [products, setProducts] = useState([]);
  const productNameOptions = useMemo(() => Array.from(new Set(products.map((p) => p.name))).sort(), [products]);
  const [orderStats, setOrderStats] = useState(null);
  const [unitPrice, setUnitPrice] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const weightOptions = useMemo(() => {
    if (!selectedProduct) return [];
    const weights = Array.isArray(selectedProduct.weights) ? selectedProduct.weights : [];
    const priceByWeight = selectedProduct.priceByWeight || {};
    return weights.map((w) => ({ value: w, label: priceByWeight[w] ? `${w} — ₹${priceByWeight[w]}` : w }));
  }, [selectedProduct]);

  const flavourOptions = useMemo(() => {
    if (!selectedProduct) return [];
    const flavours = Array.isArray(selectedProduct.flavours) ? selectedProduct.flavours : [];
    return flavours.map((f) => ({ value: f, label: f }));
  }, [selectedProduct]);

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const { showToast } = useToast();

  const [pageSize, setPageSize] = useState(10);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  // Monotonic request counters — an in-flight request that resolves after a
  // newer one has already landed is a stale response and must be dropped,
  // otherwise a slow response for order A could overwrite the UI with data
  // that predates a change just made to order B (see task item 13).
  const statsRequestIdRef = useRef(0);
  const loadRequestIdRef = useRef(0);

  // Widget stats are always global (all orders, regardless of table filters)
  // — they're dashboard-level KPIs, so this never reads statusFilter/search/etc.
  async function refreshStats() {
    const requestId = ++statsRequestIdRef.current;
    try {
      const data = await getDashboard();
      if (requestId !== statsRequestIdRef.current) return;
      if (data?.orders) {
        setOrderStats(data.orders);
        setStatsError(false);
      }
    } catch {
      if (requestId !== statsRequestIdRef.current) return;
      setStatsError(true);
    } finally {
      if (requestId === statsRequestIdRef.current) setStatsLoading(false);
    }
  }

  async function load() {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const data = await ordersApi.list({
        page,
        pageSize,
        search,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        orderType: orderTypeFilter || undefined,
        date: dateFilter || undefined,
        customerName: customerNameFilter || undefined,
        phone: phoneFilter || undefined,
        product: productFilter || undefined,
      });
      if (requestId !== loadRequestIdRef.current) return;
      setItems(data.items);
      setTotal(data.total);
      setError('');
      refreshStats();
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === loadRequestIdRef.current) setLoading(false);
    }
  }

  // Mobile-only (enabled gates the touch listeners off entirely on desktop/tablet,
  // where there's no pull gesture to catch) — re-runs the same list fetch pulled
  // to page 1's current filters, no separate refresh path to maintain.
  const { pullDistance, refreshing, progress } = usePullToRefresh(load, { enabled: isMobile });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    search,
    statusFilter,
    paymentFilter,
    orderTypeFilter,
    dateFilter,
    customerNameFilter,
    phoneFilter,
    productFilter,
  ]);

  useEffect(() => {
    productsApi.list({ page: 1, pageSize: 100 }).then((data) => setProducts(data.items)).catch(() => {});
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

  // Clears every filter/search field at once — the batch of setState calls
  // below all fire within this one event handler, so React batches them into
  // a single re-render and therefore a single load() call, not one per field.
  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setPaymentFilter('');
    setOrderTypeFilter('');
    setDateFilter('');
    setCustomerNameFilter('');
    setPhoneFilter('');
    setProductFilter('');
    setPage(1);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setError('');
    setUnitPrice(0);
    setSelectedProduct(null);
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
      paymentStatus: item.paymentStatus || 'UNPAID',
      paymentMethod: item.paymentMethod || 'CASH',
      address: item.address || '',
      notes: item.notes || '',
    });
    setFormErrors({});
    setError('');
    const matched = products.find((p) => p.name === item.productName);
    const pPrice = matched ? (matched.priceByWeight ? Object.values(matched.priceByWeight)[0] : matched.price) : 0;
    setUnitPrice(pPrice || (item.quantity ? item.totalAmount / item.quantity : 0));
    setSelectedProduct(matched || null);
    setModal({ open: true, mode: 'edit', id: item.id });
  }

  function handleSelectProduct(prod) {
    setSelectedProduct(prod || null);
    if (!prod) {
      setUnitPrice(0);
      return;
    }
    const weights = Array.isArray(prod.weights) ? prod.weights : [];
    const flavours = Array.isArray(prod.flavours) ? prod.flavours : [];
    const priceByWeight = prod.priceByWeight || {};
    const firstWeight = weights[0] || '';
    const price = firstWeight ? Number(priceByWeight[firstWeight]) || 0 : Number(prod.price) || 0;
    setUnitPrice(price);
    setForm((prev) => {
      const q = Number(prev.quantity) || 1;
      return {
        ...prev,
        weight: firstWeight,
        flavour: flavours[0] || '',
        totalAmount: price > 0 ? price * q : prev.totalAmount,
      };
    });
  }

  function handleWeightChange(weight) {
    const priceByWeight = selectedProduct?.priceByWeight || {};
    const price = Number(priceByWeight[weight]) || 0;
    setUnitPrice(price);
    setForm((prev) => {
      const q = Number(prev.quantity) || 1;
      return { ...prev, weight, totalAmount: price > 0 ? price * q : prev.totalAmount };
    });
  }

  function handleQuantityChange(newQtyStr) {
    const q = Math.max(1, Number(newQtyStr) || 1);
    if (unitPrice > 0) {
      setForm((prev) => ({ ...prev, quantity: newQtyStr, totalAmount: unitPrice * q }));
    } else {
      setForm((prev) => ({ ...prev, quantity: newQtyStr }));
    }
  }

  const remainingAmount = Math.max(
    0,
    (Number(form.totalAmount) || 0) - (Number(form.discount) || 0) - (Number(form.advancePaid) || 0),
  );

  function validateForm() {
    const errs = {};
    if (!form.customerName?.trim()) errs.customerName = 'Customer name is required';
    if (!form.phone?.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+()\s-]{7,20}$/.test(form.phone.trim())) {
      errs.phone = 'Please enter a valid phone number';
    }
    if (!form.productName?.trim()) errs.productName = 'Please select a cake or product';
    if (!form.pickupDatetime) errs.pickupDatetime = 'Pickup/Delivery date & time is required';
    if (Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    if (form.totalAmount === '' || Number(form.totalAmount) < 0) errs.totalAmount = 'Total amount is required';
    if (form.orderType === 'DELIVERY' && !form.address?.trim()) errs.address = 'Delivery address is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setSaving(true);
    setError('');
    setFormErrors({});
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        totalAmount: Number(form.totalAmount),
        discount: Math.max(0, Number(form.discount) || 0),
        advancePaid: Math.max(0, Number(form.advancePaid) || 0),
      };

      if (modal.mode === 'create') {
        await ordersApi.create(payload);
        showToast('Order created successfully.', 'success');
      } else {
        await ordersApi.update(modal.id, payload);
        showToast('Order updated successfully.', 'success');
      }
      setModal({ open: false, mode: 'create', id: null });
      await load(); // also refreshes the widget stats — see load()
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
      await load(); // also refreshes the widget stats — see load()
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleRequestStatusChange(order, targetStatus, targetLabel) {
    setStatusConfirm({ order, targetStatus, targetLabel });
  }

  async function executeStatusChange() {
    if (!statusConfirm) return;
    const { order, targetStatus } = statusConfirm;
    setStatusConfirm(null);
    setUpdatingId(order.id);
    try {
      const { order: updated } = await ordersApi.updateStatus(order.id, targetStatus);
      showToast(`Order status updated to ${targetStatus.replaceAll('_', ' ')}`, 'success');
      await load(); // also refreshes the widget stats — see load()
      if (viewing?.id === order.id) setViewing(updated);
    } catch (err) {
      showToast(err.message || 'Unable to update order status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleQuickPaymentStatusChange(order, targetPaymentStatus) {
    if (order.paymentStatus === targetPaymentStatus) return;
    setUpdatingId(order.id);
    try {
      const { order: updated } = await ordersApi.updatePaymentStatus(order.id, { paymentStatus: targetPaymentStatus });
      showToast(`Payment status updated to ${targetPaymentStatus.replaceAll('_', ' ')}`, 'success');
      await load(); // also refreshes the widget stats — see load()
      if (viewing?.id === order.id) setViewing(updated);
    } catch (err) {
      showToast(err.message || 'Unable to update payment status.', 'error');
    } finally {
      setUpdatingId(null);
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
    setTimeout(() => {
      try {
        win.print();
      } catch {}
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
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(order.invoicePath);
        showToast('Invoice link copied to clipboard.', 'success');
      } catch {
        showToast('Could not copy invoice link.', 'error');
      }
    }
  }

  async function handleDirectWhatsApp(item) {
    if (!item) return;
    try {
      const order = await ensureInvoice(item);
      if (!order) return;

      const norm = normalizePhone(order.phone);
      if (!norm.valid) {
        showToast(norm.error, 'error');
        return;
      }

      const template = getWhatsAppTemplate();
      const message = renderWhatsAppTemplate(template, order);
      const pref = getWhatsAppPreference();

      openWhatsApp({
        phone: norm.phone,
        message,
        preferredClient: pref,
      });

      showToast(`Opening WhatsApp (${pref.toUpperCase()} mode) for ${order.customerName}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Could not open WhatsApp', 'error');
    }
  }

  // Mobile card-list row for the DataTable's renderCard mode below 640px.
  // Bespoke layout (not the generic CardListItem) matching the design's Orders
  // card exactly: header (invoice + type badge + amount) → customer row with
  // direct call/WhatsApp buttons → product sub-panel → date row → inline
  // status/payment pill-buttons → footer action row. Reuses the same
  // QuickStatusDropdown/PaymentStatusDropdown/handlers as the desktop table —
  // no second status-change implementation.
  function renderOrderCard(item) {
    const isDelivery = item.orderType === 'DELIVERY';
    const dateLabel = new Date(item.pickupDatetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeLabel = new Date(item.pickupDatetime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const phoneDigits = (item.phone || '').replace(/\D/g, '');

    return (
      <div className="overflow-hidden rounded-[22px] border border-admin-border bg-admin-card shadow-xs" onClick={() => setViewing(item)}>
        {/* Header: invoice # + order-type badge + amount */}
        <div className="flex items-center gap-2.5 border-b border-admin-border/60 px-4 py-3.5">
          <span className="font-display text-base font-semibold text-admin-text">
            {item.orderNumber ? item.orderNumber.replace('ORD-', 'INV-') : '—'}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isDelivery ? 'bg-admin-primary/10 text-admin-primary' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isDelivery ? <Truck className="h-3 w-3" /> : <Store className="h-3 w-3" />}
            {isDelivery ? 'Delivery' : 'Pickup'}
          </span>
          <span className="flex-1" />
          <span className="text-lg font-extrabold text-admin-text">₹{Number(item.totalAmount).toLocaleString()}</span>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-4 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-admin-text">{item.customerName}</p>
              <p className="truncate text-[13px] text-admin-muted">{item.phone}</p>
            </div>
            <a
              href={`tel:${phoneDigits}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-admin-border text-admin-text"
              aria-label="Call customer"
            >
              <Phone className="h-4.5 w-4.5" />
            </a>
            <button
              type="button"
              onClick={() => handleDirectWhatsApp(item)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-admin-border text-emerald-600"
              aria-label="Message on WhatsApp"
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-admin-bg p-3">
            <div className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-2xl bg-admin-border text-rose-deep">
              <Cake className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-admin-text">{item.productName}</p>
              <p className="truncate text-xs text-admin-muted">
                {[item.weight, item.flavour, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] text-admin-text">
            <CalendarClock className="h-4 w-4 shrink-0 text-admin-primary" />
            <span className="font-bold">{dateLabel}</span>
            <span className="text-admin-muted">·</span>
            <span className="font-bold">{timeLabel}</span>
          </div>

          <div className="flex gap-2.5">
            <div className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-admin-border bg-admin-card">
              <QuickStatusDropdown order={item} onRequestChange={handleRequestStatusChange} loadingId={updatingId} />
            </div>
            <div className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-admin-border bg-admin-card">
              <PaymentStatusDropdown order={item} onUpdate={handleQuickPaymentStatusChange} />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex gap-2.5 border-t border-admin-border/60 bg-admin-bg/40 px-4 py-3"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setViewing(item)}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-admin-primary text-sm font-bold text-white"
          >
            <Eye className="h-4 w-4" /> View
          </button>
          <button
            type="button"
            onClick={() => openEdit(item)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-admin-border text-admin-text"
            aria-label="Edit order"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleInvoiceDownload(item)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-admin-border text-admin-text"
            aria-label="Download invoice"
          >
            <FileText className="h-4 w-4" />
          </button>
          <OrderCardMoreMenu order={item} onPrint={handlePrintInvoice} onShare={handleShareInvoice} onDelete={(id) => setConfirmDelete(id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-only in practice — see usePullToRefresh's `enabled` gate above;
          harmless to render unconditionally since it collapses to nothing when idle. */}
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} progress={progress} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Operations</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Orders</h1>
          <p className="mt-1 text-sm text-admin-muted">Manage daily bakery orders, cooking lifecycles, and invoices.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-admin-primary px-5 py-2.5 font-semibold text-white hover:bg-admin-primary-hover transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Below sm: a horizontally-scrollable snap strip (segmented-pill pattern) instead of
          wrapping to extra rows; sm: and up this is the original grid, untouched. */}
      {statsError ? (
        <OrderStatsError onRetry={refreshStats} />
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-4 xl:grid-cols-7">
          {statsLoading
            ? STAT_CARDS.map((card) => (
                <div key={card.key || 'total'} className="w-36 shrink-0 snap-start sm:w-auto sm:shrink">
                  <OrderStatCardSkeleton />
                </div>
              ))
            : STAT_CARDS.map((card) => (
                <div key={card.key || 'total'} className="w-36 shrink-0 snap-start sm:w-auto sm:shrink">
                  <OrderStatCard
                    card={card}
                    value={card.key === '' ? orderStats.total : orderStats[card.key.toLowerCase()]}
                    active={statusFilter === card.key}
                    onSelect={(key) => {
                      setStatusFilter((prev) => (key === '' ? '' : prev === key ? '' : key));
                      setPage(1);
                    }}
                  />
                </div>
              ))}
        </div>
      )}

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      {/* Primary Filters Row — desktop/tablet: unchanged inline row.
          Mobile: search + a single Filters funnel button (badge = active count),
          matching the design — status/date/etc. all live inside the Filters sheet. */}
      <div className="hidden flex-wrap items-center gap-3 sm:flex">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, phone, order #…" />
        <ThemedSelect
          theme="admin"
          className="w-44"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'PREPARING', label: 'Preparing' },
            { value: 'READY', label: 'Ready' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
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
          className="rounded-xl border border-admin-border px-3.5 py-2.5 text-sm font-semibold text-admin-primary hover:bg-admin-bg transition-colors"
        >
          {showMoreFilters ? 'Fewer Filters' : 'More Filters'}
        </button>
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

      <div className="flex items-center gap-2.5 sm:hidden">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone, invoice…" />
        </div>
        <button
          type="button"
          onClick={() => setShowMoreFilters(true)}
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

      {/* Secondary Filters — desktop keeps the inline expanding panel of plain
          fields (unchanged); the mobile Filters sheet additionally leads with
          chip-toggle groups for the two status filters, per the design. */}
      {(() => {
        const customerNameField = (
          <input
            value={customerNameFilter}
            onChange={(e) => {
              setCustomerNameFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Customer name"
            className="w-full rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text sm:w-auto sm:py-2"
          />
        );
        const phoneField = (
          <input
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Phone"
            className="w-full rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-sm text-admin-text sm:w-auto sm:py-2"
          />
        );
        const productField = (
          <ThemedSelect
            theme="admin"
            className="w-full sm:w-44"
            value={productFilter}
            onChange={(v) => {
              setProductFilter(v);
              setPage(1);
            }}
            placeholder="All Products"
            options={[{ value: '', label: 'All Products' }, ...productNameOptions.map((name) => ({ value: name, label: name }))]}
          />
        );
        const paymentSelectField = (
          <ThemedSelect
            theme="admin"
            className="w-full sm:w-40"
            value={paymentFilter}
            onChange={(v) => {
              setPaymentFilter(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Payments' },
              { value: 'UNPAID', label: 'Unpaid' },
              { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { value: 'PAID', label: 'Paid' },
              { value: 'REFUNDED', label: 'Refunded' },
            ]}
          />
        );
        const orderTypeField = (
          <ThemedSelect
            theme="admin"
            className="w-full sm:w-36"
            value={orderTypeFilter}
            onChange={(v) => {
              setOrderTypeFilter(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Types' },
              { value: 'PICKUP', label: 'Pickup' },
              { value: 'DELIVERY', label: 'Delivery' },
            ]}
          />
        );

        return (
          <>
            {showMoreFilters && !isMobile && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-admin-border/60 bg-admin-card p-4">
                {customerNameField}
                {phoneField}
                {productField}
                {paymentSelectField}
                {orderTypeField}
              </div>
            )}
            <BottomSheet
              open={showMoreFilters && isMobile}
              title="Filters"
              onClose={() => setShowMoreFilters(false)}
              footer={
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      setShowMoreFilters(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-admin-border bg-admin-card py-3 text-sm font-bold text-admin-text"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset all
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMoreFilters(false)}
                    className="flex flex-[1.4] items-center justify-center rounded-2xl bg-admin-primary py-3 text-sm font-bold text-white"
                  >
                    Apply filters
                  </button>
                </div>
              }
            >
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Order status</p>
                  <FilterChipGroup
                    options={ORDER_STATUS_FILTER_OPTIONS}
                    value={statusFilter}
                    onChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    configMap={ORDER_STATUS_CONFIG}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Payment status</p>
                  <FilterChipGroup
                    options={PAYMENT_STATUS_FILTER_OPTIONS}
                    value={paymentFilter}
                    onChange={(v) => {
                      setPaymentFilter(v);
                      setPage(1);
                    }}
                    configMap={PAYMENT_STATUS_CONFIG}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Delivery date</p>
                  <DatePicker
                    theme="admin"
                    value={dateFilter}
                    onChange={(v) => {
                      setDateFilter(v);
                      setPage(1);
                    }}
                    placeholder="Any date"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-admin-muted">Product</p>
                  {productField}
                </div>
                {customerNameField}
                {phoneField}
                {orderTypeField}
              </div>
            </BottomSheet>
          </>
        );
      })()}

      {/* Orders Table — ACTIONS COLUMN FIRST (renders as a card list below 640px via renderCard) */}
      <DataTable
        theme="admin"
        sticky
        zebra
        spacious
        actionsPosition="start"
        minWidthClass="min-w-0"
        renderCard={renderOrderCard}
        loading={loading}
        items={items}
        renderEmpty={
          <EmptyState
            icon={ClipboardList}
            title="No orders found"
            message="Log an order taken over WhatsApp, phone, or in person."
            actionLabel="Create First Order"
            onAction={openCreate}
          />
        }
        renderActions={(item) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="View Order Details"
              onClick={() => setViewing(item)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border text-admin-text hover:bg-admin-primary/10 hover:text-admin-primary transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Send WhatsApp Invoice"
              onClick={() => handleDirectWhatsApp(item)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Edit Order"
              onClick={() => openEdit(item)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-admin-border text-admin-text hover:bg-admin-bg transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Delete Order"
              onClick={() => setConfirmDelete(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        columns={[
          {
            key: 'orderNumber',
            label: 'Invoice No',
            render: (i) => (
              <span className="font-mono text-xs font-bold text-admin-text">
                {i.orderNumber ? i.orderNumber.replace('ORD-', 'INV-') : '—'}
              </span>
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
                <p className="font-semibold text-admin-text">{i.productName}</p>
                {i.weight && <p className="text-xs text-admin-muted">{i.weight}</p>}
              </div>
            ),
          },
          {
            key: 'pickupDatetime',
            label: 'Delivery Date & Time',
            render: (i) => (
              <div>
                <p className="text-admin-text font-medium">
                  {new Date(i.pickupDatetime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-admin-muted">
                  {new Date(i.pickupDatetime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ({i.orderType})
                </p>
              </div>
            ),
          },
          { key: 'totalAmount', label: 'Amount', render: (i) => `₹${Number(i.totalAmount).toFixed(2)}` },
          {
            key: 'status',
            label: 'Order Status',
            render: (i) => (
              <QuickStatusDropdown
                order={i}
                onRequestChange={handleRequestStatusChange}
                loadingId={updatingId}
              />
            ),
          },
          {
            key: 'paymentStatus',
            label: 'Payment Status',
            render: (i) => (
              <PaymentStatusDropdown
                order={i}
                onUpdate={handleQuickPaymentStatusChange}
              />
            ),
          },
        ]}
      />

      <Pagination theme="admin" page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />

      {/* NEW ORDER MODAL — 5 CLEAR SECTIONS WITH STICKY HEADER & STICKY FOOTER */}
      <Modal
        open={modal.open}
        title={modal.mode === 'create' ? 'New Order' : 'Edit Order'}
        subtitle="Create and manage a customer order"
        onClose={() => setModal({ ...modal, open: false })}
        wide
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-admin-muted font-medium">* Fields marked with an asterisk are required</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModal({ ...modal, open: false })}
                className="rounded-xl border border-admin-border px-5 py-2 text-sm font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-xl bg-admin-primary px-6 py-2 text-sm font-semibold text-white hover:bg-admin-primary-hover disabled:opacity-60 transition-colors shadow-sm flex items-center gap-2"
              >
                {saving ? <ButtonLoader /> : modal.mode === 'create' ? 'Save Order' : 'Update Order'}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

          {/* SECTION 1 — CUSTOMER DETAILS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-admin-border/60 pb-1.5">
              <User className="h-4 w-4 text-admin-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text">Customer</h3>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TextField
                label="Customer Name"
                required
                value={form.customerName}
                onChange={(e) => {
                  setForm({ ...form, customerName: e.target.value });
                  if (formErrors.customerName) setFormErrors({ ...formErrors, customerName: null });
                }}
                error={formErrors.customerName}
                placeholder="e.g. Patel Ansh"
              />
              <TextField
                label="Phone Number"
                required
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                }}
                error={formErrors.phone}
                placeholder="e.g. 9510532922"
              />
            </div>
          </div>

          {/* SECTION 2 — ORDER DETAILS */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-admin-border/60 pb-1.5">
              <Cake className="h-4 w-4 text-admin-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text">Order</h3>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-admin-text">
                  Cake / Product <span className="text-admin-primary">*</span>
                </label>
                <ProductCombobox
                  value={form.productName}
                  onChange={(name) => {
                    setForm({ ...form, productName: name });
                    if (formErrors.productName) setFormErrors({ ...formErrors, productName: null });
                  }}
                  onSelectProduct={handleSelectProduct}
                  products={products}
                  error={formErrors.productName}
                />
                {formErrors.productName && <p className="mt-1 text-[11px] font-semibold text-rose-600">{formErrors.productName}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-admin-text">Weight / Size</label>
                {selectedProduct && weightOptions.length > 0 ? (
                  <ThemedSelect
                    theme="admin"
                    value={form.weight}
                    onChange={handleWeightChange}
                    options={weightOptions}
                    placeholder="Select weight"
                  />
                ) : (
                  <TextField
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g. 500g"
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-admin-text">Flavour</label>
                {selectedProduct && flavourOptions.length > 0 ? (
                  <ThemedSelect
                    theme="admin"
                    value={form.flavour}
                    onChange={(v) => setForm({ ...form, flavour: v })}
                    options={flavourOptions}
                    placeholder="Select flavour"
                  />
                ) : (
                  <TextField
                    value={form.flavour}
                    onChange={(e) => setForm({ ...form, flavour: e.target.value })}
                    placeholder="e.g. Chocolate Truffle"
                  />
                )}
              </div>

              <SelectField
                label="Order Type"
                required
                value={form.orderType}
                onChange={(e) => setForm({ ...form, orderType: e.target.value })}
              >
                <option value="PICKUP">Pickup</option>
                <option value="DELIVERY">Delivery</option>
              </SelectField>
            </div>
          </div>

          {/* SECTION 3 — DELIVERY / PICKUP */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-admin-border/60 pb-1.5">
              <CalendarClock className="h-4 w-4 text-admin-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text">
                {form.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
              </h3>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-admin-text">
                  {form.orderType === 'DELIVERY' ? 'Delivery Date & Time' : 'Pickup Date & Time'} <span className="text-admin-primary">*</span>
                </label>
                <DatePicker
                  theme="admin"
                  value={splitDatetimeLocal(form.pickupDatetime).date}
                  time={splitDatetimeLocal(form.pickupDatetime).time}
                  onChange={(date) => {
                    setForm({ ...form, pickupDatetime: combineDatetimeLocal(date, splitDatetimeLocal(form.pickupDatetime).time) });
                    if (formErrors.pickupDatetime) setFormErrors({ ...formErrors, pickupDatetime: null });
                  }}
                  onTimeChange={(time) => {
                    setForm({ ...form, pickupDatetime: combineDatetimeLocal(splitDatetimeLocal(form.pickupDatetime).date, time) });
                    if (formErrors.pickupDatetime) setFormErrors({ ...formErrors, pickupDatetime: null });
                  }}
                  placeholder="Select date & time"
                />
                {formErrors.pickupDatetime && <p className="mt-1 text-[11px] font-semibold text-rose-600">{formErrors.pickupDatetime}</p>}
              </div>

              {form.orderType === 'DELIVERY' && (
                <TextAreaField
                  label="Delivery Address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                  }}
                  error={formErrors.address}
                  placeholder="Street name, landmark, area…"
                />
              )}
            </div>
          </div>

          {/* SECTION 4 — PAYMENT */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-admin-border/60 pb-1.5">
              <IndianRupee className="h-4 w-4 text-admin-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text">Payment</h3>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-4">
              <SelectField
                label="Payment Status"
                required
                value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
              </SelectField>

              <SelectField
                label="Payment Method"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / Online</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </SelectField>

              <TextField
                label="Quantity"
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                error={formErrors.quantity}
              />

              <TextField
                label="Total Amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.totalAmount}
                onChange={(e) => {
                  setForm({ ...form, totalAmount: e.target.value });
                  if (formErrors.totalAmount) setFormErrors({ ...formErrors, totalAmount: null });
                }}
                error={formErrors.totalAmount}
                placeholder="₹0.00"
              />
            </div>

            <div className="grid gap-3 grid-cols-3 p-3.5 rounded-2xl bg-admin-bg border border-admin-border/60">
              <TextField
                label="Discount"
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="₹0.00"
              />
              <TextField
                label="Advance Paid"
                type="number"
                min="0"
                step="0.01"
                value={form.advancePaid}
                onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                placeholder="₹0.00"
              />
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-admin-muted">Remaining</span>
                <p className="rounded-xl border border-admin-border bg-white px-3 py-2 text-sm font-bold text-admin-primary">
                  ₹{remainingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5 — ADDITIONAL INFORMATION */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-admin-border/60 pb-1.5">
              <StickyNote className="h-4 w-4 text-admin-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text">Notes</h3>
            </div>
            <TextAreaField
              label="Notes / Instructions"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Cake message, allergies, special delivery notes…"
            />
          </div>
        </form>
      </Modal>

      {/* Order Details Drawer */}
      <Drawer
        open={Boolean(viewing)}
        title={viewing ? viewing.orderNumber.replace('ORD-', 'INV-') : 'Order Details'}
        onClose={() => setViewing(null)}
        mobileBottomSheet
      >
        {viewing && (
          <div className="space-y-5">
            {/* Customer & Status Header */}
            <div className="rounded-2xl border border-admin-border bg-admin-card p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-admin-text">{viewing.customerName}</p>
                  <p className="flex items-center gap-1.5 text-sm text-admin-muted mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-admin-primary" /> {viewing.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-admin-muted">Invoice No</span>
                  <p className="font-mono text-sm font-bold text-admin-text">
                    {(viewing.orderNumber || 'ORD-0000').replace('ORD-', 'INV-')}
                  </p>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <OrderLifecycleTimeline order={viewing} />

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3 border-t border-b border-admin-border/60 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted mb-1">Order Status</p>
                  <QuickStatusDropdown order={viewing} onRequestChange={handleRequestStatusChange} loadingId={updatingId} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-admin-muted mb-1">Payment Status</p>
                  <PaymentStatusDropdown order={viewing} onUpdate={handleQuickPaymentStatusChange} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-admin-bg p-4 text-sm">
              <Field label="Cake / Product" value={viewing.productName} />
              <Field label="Weight" value={viewing.weight || '—'} />
              <Field label="Flavour" value={viewing.flavour || '—'} />
              <Field label="Quantity" value={viewing.quantity} />
              <Field label="Delivery Type" value={viewing.orderType} />
              <Field label="Delivery Date & Time" value={formatDateTime(viewing.pickupDatetime)} />
            </div>

            {viewing.address && (
              <div className="rounded-2xl bg-admin-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Delivery Address</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-admin-text">{viewing.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-admin-bg p-4 text-sm">
              <Field label="Total Amount" value={`₹${Number(viewing.totalAmount).toFixed(2)}`} />
              <Field label="Payment Method" value={PAYMENT_METHOD_LABELS[viewing.paymentMethod] || viewing.paymentMethod || 'Cash'} />
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">Audit &amp; Activity Log</p>
              {timelineLoading ? (
                <p className="text-sm text-admin-muted">Loading timeline…</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-admin-muted">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-2 border-l border-admin-border pl-4">
                  {timeline.map((event) => (
                    <li key={event.id} className="relative text-sm">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-admin-primary" />
                      <p className="font-semibold text-admin-text">{event.action.replaceAll('_', ' ')}</p>
                      <p className="text-xs text-admin-muted">
                        {event.adminName} · {formatDateTime(event.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-admin-border pt-4">
              <button
                type="button"
                onClick={() => handleInvoiceDownload(viewing)}
                className="flex items-center gap-2 rounded-xl bg-admin-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-primary-hover transition-colors"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </button>
              <button
                type="button"
                onClick={() => handleDirectWhatsApp(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> Send WhatsApp
              </button>
              <button
                type="button"
                onClick={() => handlePrintInvoice(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                type="button"
                onClick={() => handleShareInvoice(viewing)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text hover:bg-admin-bg transition-colors"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        open={Boolean(statusConfirm)}
        title={`Update Order Status?`}
        message={`Change order #${statusConfirm?.order.orderNumber?.replace('ORD-', 'INV-')} (${statusConfirm?.order.customerName}) from ${statusConfirm?.order.status} to ${statusConfirm?.targetStatus}?`}
        confirmLabel={statusConfirm?.targetStatus === 'CANCELLED' ? 'Cancel Order' : 'Update Status'}
        danger={statusConfirm?.targetStatus === 'CANCELLED'}
        onConfirm={executeStatusChange}
        onCancel={() => setStatusConfirm(null)}
      />

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
