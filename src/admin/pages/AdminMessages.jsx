import { useEffect, useState } from 'react';
import { Mail, X, Phone, Inbox, Cake, Calendar, Scale, Eye, CheckCheck, Archive, MessageCircle } from 'lucide-react';
import { messagesApi } from '../services/adminApi';
import { emitMessagesUpdate } from '../utils/messagesBus';
import { useToast } from '../components/ToastProvider';
import DataTable from '../components/DataTable';
import CardListItem from '../components/CardListItem';
import BottomSheet from '../components/BottomSheet';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';
import useIsMobile from '../hooks/useIsMobile';

const STATUS_STYLES = {
  NEW: 'bg-admin-primary/10 text-admin-primary',
  READ: 'bg-admin-border/60 text-admin-text',
  ARCHIVED: 'bg-admin-muted/10 text-admin-muted',
};

function MessageStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.READ}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }) {
  const isCustomCake = source === 'CUSTOM_CAKE';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        isCustomCake ? 'bg-rose/10 text-rose-deep' : 'bg-admin-border/50 text-admin-text'
      }`}
    >
      {isCustomCake && <Cake className="h-3 w-3" />}
      {isCustomCake ? 'Custom Cake' : 'Contact'}
    </span>
  );
}

export default function AdminMessages() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();

  const [pageSize, setPageSize] = useState(10);

  async function load() {
    setLoading(true);
    try {
      const data = await messagesApi.list({ page, pageSize, search, status: statusFilter || undefined });
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
  }, [page, pageSize, search, statusFilter]);

  function handlePageSizeChange(size) {
    setPageSize(size);
    setPage(1);
  }

  async function updateStatus(id, status) {
    try {
      await messagesApi.updateStatus(id, status);
      showToast(`Message marked as ${status.toLowerCase()}.`, 'success');
      load();
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      emitMessagesUpdate();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderMessageCard(item) {
    const isCustomCake = item.source === 'CUSTOM_CAKE';
    const isNew = item.status === 'NEW';
    const dateLabel = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeLabel = new Date(item.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const phoneDigits = (item.phone || '').replace(/\D/g, '');

    return (
      <div
        className={`overflow-hidden rounded-[22px] border bg-admin-card shadow-xs transition-all duration-200 hover:shadow-md ${
          isNew ? 'border-admin-primary/40 ring-1 ring-admin-primary/20' : 'border-admin-border'
        }`}
        onClick={() => setSelected(item)}
      >
        {/* Header Row: Customer details + Status Badge */}
        <div className="flex items-center justify-between gap-3 border-b border-admin-border/60 px-4 py-3.5 bg-admin-bg/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-admin-primary/15 to-admin-primary/5 text-admin-primary font-bold text-sm shadow-2xs">
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-admin-text">{item.name}</p>
                {isNew && <span className="h-2 w-2 rounded-full bg-admin-primary shrink-0" />}
              </div>
              <p className="truncate text-xs text-admin-muted">{item.email || 'No email provided'}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <MessageStatusBadge status={item.status} />
          </div>
        </div>

        {/* Body Details & Custom Cake Pills */}
        <div className="flex flex-col gap-3 px-4 py-3.5" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-2">
            <SourceBadge source={item.source} />
            <span className="text-[11px] font-semibold text-admin-muted">{dateLabel} · {timeLabel}</span>
          </div>

          {/* If Custom Cake Request: show occasion, weight, delivery date tags */}
          {isCustomCake && (item.occasion || item.cakeWeight || item.deliveryDate) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-rose-50/60 border border-rose-100/60 p-2.5 text-xs">
              {item.occasion && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                  <Cake className="h-3.5 w-3.5 text-rose-500" /> {item.occasion}
                </span>
              )}
              {item.cakeWeight && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 border-l border-rose-200/80 pl-2">
                  <Scale className="h-3.5 w-3.5 text-rose-500" /> {item.cakeWeight}
                </span>
              )}
              {item.deliveryDate && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 border-l border-rose-200/80 pl-2">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" /> {new Date(item.deliveryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Message snippet box */}
          <div className="rounded-xl border border-admin-border/50 bg-admin-bg/50 p-3">
            <p className="text-xs sm:text-sm text-admin-text leading-relaxed line-clamp-2">{item.message}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center gap-2 border-t border-admin-border/60 bg-admin-bg/40 px-4 py-2.5"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setSelected(item)}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-admin-primary text-xs font-bold text-white transition-colors hover:bg-admin-primary-hover shadow-2xs"
          >
            <Eye className="h-3.5 w-3.5" /> Read Enquiry
          </button>

          {phoneDigits && (
            <>
              <a
                href={`tel:${phoneDigits}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-admin-border text-admin-text transition-colors hover:bg-admin-bg"
                aria-label="Call customer"
                title="Call Customer"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi ${item.name}, thank you for reaching out to Cakes by Tulsi!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                aria-label="WhatsApp reply"
                title="WhatsApp Reply"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </>
          )}

          {item.status !== 'READ' && (
            <button
              type="button"
              onClick={() => updateStatus(item.id, 'READ')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-admin-border text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
              aria-label="Mark Read"
              title="Mark as Read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}

          {item.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={() => updateStatus(item.id, 'ARCHIVED')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-admin-border text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-text"
              aria-label="Archive"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-admin-primary">Inbox</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-admin-text">Messages</h1>
        <p className="mt-0.5 text-xs sm:text-sm text-admin-muted">Enquiries submitted through the public contact form & custom cake requests.</p>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {['', 'NEW', 'READ', 'ARCHIVED'].map((status) => (
            <button
              key={status || 'all'}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-admin-primary text-white shadow-xs'
                  : 'border border-admin-border text-admin-muted bg-admin-card hover:bg-admin-bg'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        theme="admin"
        loading={loading}
        items={items}
        renderCard={renderMessageCard}
        renderEmpty={
          <EmptyState
            icon={Inbox}
            title="No messages yet"
            message="Enquiries from your contact form and custom cake requests will show up here."
          />
        }
        columns={[
          { key: 'source', label: 'Type', render: (i) => <SourceBadge source={i.source} /> },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone', render: (i) => i.phone || '—' },
          { key: 'message', label: 'Message', render: (i) => <span className="line-clamp-1 max-w-xs">{i.message}</span> },
          { key: 'status', label: 'Status', render: (i) => <MessageStatusBadge status={i.status} /> },
          { key: 'createdAt', label: 'Received', render: (i) => new Date(i.createdAt).toLocaleDateString() },
        ]}
        renderActions={(item) => (
          <button
            type="button"
            onClick={() => setSelected(item)}
            className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold text-admin-text hover:bg-admin-bg"
          >
            View
          </button>
        )}
      />

      <Pagination theme="admin" page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />

      {/* Mobile: bottom sheet */}
      {selected && isMobile && (
        <BottomSheet
          open
          onClose={() => setSelected(null)}
          title={selected.name}
          footer={
            <div className="flex gap-2">
              {selected.status !== 'READ' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, 'READ')}
                  className="flex-1 rounded-xl bg-admin-primary py-3 text-xs font-bold text-white hover:bg-admin-primary-hover transition-colors"
                >
                  Mark Read
                </button>
              )}
              {selected.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, 'ARCHIVED')}
                  className="flex-1 rounded-xl border border-admin-border bg-admin-card py-3 text-xs font-bold text-admin-text hover:bg-admin-bg transition-colors"
                >
                  Archive
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <SourceBadge source={selected.source} />
              <span className="text-xs text-admin-muted">{new Date(selected.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-admin-muted">{selected.email}</p>

            {selected.phone && (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${(selected.phone || '').replace(/\D/g, '')}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-admin-border bg-admin-card py-2.5 text-xs font-bold text-admin-text hover:bg-admin-bg transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-admin-primary" /> Call {selected.phone}
                </a>
                <a
                  href={`https://wa.me/${(selected.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selected.name}, thank you for contacting Cakes by Tulsi!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                </a>
              </div>
            )}

            {selected.source === 'CUSTOM_CAKE' && (
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-admin-bg p-3.5 text-xs">
                {selected.occasion && (
                  <div>
                    <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-admin-muted text-[10px]">
                      <Cake className="h-3 w-3" /> Occasion
                    </p>
                    <p className="mt-0.5 font-bold text-admin-text">{selected.occasion}</p>
                  </div>
                )}
                {selected.cakeWeight && (
                  <div>
                    <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-admin-muted text-[10px]">
                      <Scale className="h-3 w-3" /> Cake Weight
                    </p>
                    <p className="mt-0.5 font-bold text-admin-text">{selected.cakeWeight}</p>
                  </div>
                )}
                {selected.deliveryDate && (
                  <div>
                    <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-admin-muted text-[10px]">
                      <Calendar className="h-3 w-3" /> Delivery Date
                    </p>
                    <p className="mt-0.5 font-bold text-admin-text">{new Date(selected.deliveryDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-admin-bg p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-admin-muted mb-1.5">
                <Mail className="h-3 w-3" /> Message
              </p>
              <p className="whitespace-pre-wrap text-xs sm:text-sm text-admin-text leading-relaxed">{selected.message}</p>
            </div>
          </div>
        </BottomSheet>
      )}

      {selected && !isMobile && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10">
          <div className="w-full max-w-lg rounded-admin border border-admin-border bg-admin-card p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <SourceBadge source={selected.source} />
                <p className="mt-2 font-display text-lg font-semibold text-admin-text">{selected.name}</p>
                <p className="text-sm text-admin-muted">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-admin-muted hover:bg-admin-bg"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.phone && (
              <p className="mt-3 flex items-center gap-2 text-sm text-admin-text">
                <Phone className="h-4 w-4 text-admin-primary" /> {selected.phone}
              </p>
            )}

            {selected.source === 'CUSTOM_CAKE' && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-admin-bg p-4 text-sm sm:grid-cols-3">
                {selected.occasion && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-admin-muted">
                      <Cake className="h-3.5 w-3.5" /> Occasion
                    </p>
                    <p className="mt-1 font-semibold text-admin-text">{selected.occasion}</p>
                  </div>
                )}
                {selected.cakeWeight && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-admin-muted">
                      <Scale className="h-3.5 w-3.5" /> Cake Weight
                    </p>
                    <p className="mt-1 font-semibold text-admin-text">{selected.cakeWeight}</p>
                  </div>
                )}
                {selected.deliveryDate && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-admin-muted">
                      <Calendar className="h-3.5 w-3.5" /> Delivery Date
                    </p>
                    <p className="mt-1 font-semibold text-admin-text">{new Date(selected.deliveryDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-admin-bg p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">
                <Mail className="h-3.5 w-3.5" /> Message
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-admin-text">{selected.message}</p>
            </div>

            <p className="mt-3 text-xs text-admin-muted">Received {new Date(selected.createdAt).toLocaleString()}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {selected.status !== 'READ' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, 'READ')}
                  className="rounded-xl bg-admin-primary px-4 py-2 text-sm font-semibold text-white hover:bg-admin-primary-hover"
                >
                  Mark as Read
                </button>
              )}
              {selected.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, 'ARCHIVED')}
                  className="rounded-xl border border-admin-border px-4 py-2 text-sm font-semibold text-admin-text hover:bg-admin-bg"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
