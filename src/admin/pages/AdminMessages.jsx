import { useEffect, useState } from 'react';
import { Mail, X, Phone, Inbox, Cake, Calendar, Scale } from 'lucide-react';
import { messagesApi } from '../services/adminApi';
import { useToast } from '../components/ToastProvider';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import EmptyState from '../components/EmptyState';

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
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Inbox</p>
        <h1 className="font-display text-3xl font-semibold text-admin-text">Messages</h1>
        <p className="mt-1 text-sm text-admin-muted">Enquiries submitted through the public contact form.</p>
      </div>

      {error && <p className="rounded-2xl bg-admin-danger/10 p-3 text-sm text-admin-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
        <div className="flex gap-2">
          {['', 'NEW', 'READ', 'ARCHIVED'].map((status) => (
            <button
              key={status || 'all'}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === status
                  ? 'bg-admin-primary text-white'
                  : 'border border-admin-border text-admin-muted hover:bg-admin-bg'
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

      {selected && (
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
