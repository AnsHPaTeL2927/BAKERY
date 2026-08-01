import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  Tags,
  Cake,
  Images,
  GalleryHorizontal,
  BadgePercent,
  MessageSquareQuote,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import GlobalSearch from '../components/GlobalSearch';
import NotificationsDropdown from '../components/NotificationsDropdown';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/products', label: 'Products', icon: Cake },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/banners', label: 'Hero Banner', icon: GalleryHorizontal },
  { to: '/admin/offers', label: 'Offers', icon: BadgePercent },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function NavList({ activePath, onNavigate, collapsed }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activePath.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors"
          >
            {active && (
              <motion.span
                layoutId="admin-sidebar-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-admin-primary"
              />
            )}
            <motion.span whileHover={{ x: active ? 0 : 2 }} className="relative z-10 flex items-center gap-3">
              <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-admin-muted'}`} />
              <span className={`whitespace-nowrap ${collapsed ? 'hidden lg:inline' : ''} ${active ? 'text-white' : 'text-admin-text'}`}>
                {item.label}
              </span>
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [now] = useState(() => new Date());

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-admin-bg">
      {/* Desktop / tablet sticky sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r border-admin-border bg-admin-card md:flex lg:w-64">
        <div className="flex h-16 items-center gap-2 border-b border-admin-border px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-primary font-display text-lg font-semibold text-white">
            T
          </span>
          <div className="hidden lg:block">
            <p className="font-display text-sm font-semibold leading-tight text-admin-text">Cakes by Tulsi</p>
            <p className="text-xs text-admin-muted">Admin Panel</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavList activePath={location.pathname} collapsed />
        </div>
        <div className="hidden border-t border-admin-border p-4 lg:block">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text transition-colors hover:bg-admin-bg"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-admin-card md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-admin-border px-4">
                <p className="font-display text-sm font-semibold text-admin-text">Cakes by Tulsi</p>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-admin-muted" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto py-4">
                <NavList activePath={location.pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-admin-border p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-admin-border px-4 py-2.5 text-sm font-semibold text-admin-text"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="md:pl-20 lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-admin-border bg-admin-card/90 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-admin-text hover:bg-admin-bg md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate font-display text-lg font-semibold text-admin-text">
              {getGreeting()}, {admin?.name?.split(' ')[0] || 'Admin'} 👋
            </p>
            <p className="text-xs text-admin-muted">{dateLabel}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <GlobalSearch />
            <NotificationsDropdown />

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-admin-border px-2 py-1.5 hover:bg-admin-bg"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-primary/10 text-sm font-semibold text-admin-primary">
                  {admin?.name?.[0]?.toUpperCase() || 'A'}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-30 truncate text-sm font-semibold text-admin-text">{admin?.name}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-admin-muted sm:block" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 z-30 mt-2 w-56 rounded-admin border border-admin-border bg-admin-card p-2 shadow-xl"
                    >
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold text-admin-text">{admin?.name}</p>
                        <p className="truncate text-xs text-admin-muted">{admin?.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-admin-danger hover:bg-admin-bg"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
