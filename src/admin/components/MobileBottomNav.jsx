import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Plus, Mail, Menu } from 'lucide-react';

function NavButton({ to, label, icon: Icon, active }) {
  return (
    <Link to={to} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5">
      <Icon className={`h-5 w-5 ${active ? 'text-admin-primary' : 'text-admin-muted'}`} />
      <span className={`text-[10px] font-semibold ${active ? 'text-admin-primary' : 'text-admin-muted'}`}>{label}</span>
    </Link>
  );
}

// The mobile primary navigation — thumb-reachable, always visible, covers the
// four highest-frequency destinations plus a prominent "+" for the single
// most common action (logging a new order). Everything else stays behind
// "More", which opens the existing full nav drawer rather than duplicating it.
export default function MobileBottomNav({ onOpenMore }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-admin-border bg-admin-card px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Primary"
    >
      <NavButton to="/admin/dashboard" label="Home" icon={LayoutDashboard} active={path.startsWith('/admin/dashboard')} />
      <NavButton to="/admin/orders" label="Orders" icon={ClipboardList} active={path === '/admin/orders'} />

      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={() => navigate('/admin/orders?new=1')}
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-admin-primary text-white shadow-lg shadow-admin-primary/40 transition-transform active:scale-95"
          aria-label="New Order"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <NavButton to="/admin/messages" label="Messages" icon={Mail} active={path.startsWith('/admin/messages')} />

      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
        aria-label="More menu"
      >
        <Menu className="h-5 w-5 text-admin-muted" />
        <span className="text-[10px] font-semibold text-admin-muted">More</span>
      </button>
    </nav>
  );
}
