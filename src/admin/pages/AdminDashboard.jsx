import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Users,
  ShoppingBag,
  MessageCircle,
  Phone,
  Mail,
  Images,
  Eye,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Tags,
  GalleryHorizontal,
  BadgePercent,
  Settings,
  Sparkles,
  ClipboardList,
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  IndianRupee,
  CalendarClock,
  Truck,
  Store,
  AlertTriangle,
  Globe,
  Cake,
} from 'lucide-react';
import { getDashboard, productsApi, messagesApi } from '../services/adminApi';
import { useToast } from '../components/ToastProvider';
import useIsMobile from '../hooks/useIsMobile';
import KpiCard from '../components/KpiCard';
import StatCard from '../components/StatCard';
import AnimatedNumber from '../components/AnimatedNumber';
import Skeleton from '../../components/loading/Skeleton';
import ActivityTimeline from '../components/ActivityTimeline';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import CardListItem from '../components/CardListItem';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function trendPct(curr, prevVal) {
  if (!prevVal) return curr > 0 ? 100 : 0;
  return ((curr - prevVal) / prevVal) * 100;
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatLongDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CustomBarYAxisTick({ x, y, payload }) {
  const name = payload?.value || '';
  const truncated = name.length > 20 ? `${name.slice(0, 18)}…` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      <text
        x={-8}
        y={4}
        textAnchor="end"
        style={{ fontSize: '11px', fontWeight: 600, fill: '#2F2F2F' }}
      >
        {truncated}
      </text>
    </g>
  );
}

function CustomTrafficTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-2xl border border-admin-border bg-white/95 p-3 shadow-xl backdrop-blur-md">
      <p className="text-[11px] font-bold text-admin-muted uppercase tracking-wider">{formatLongDate(label)}</p>
      <p className="mt-1 text-sm font-extrabold text-admin-primary flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-admin-primary inline-block" />
        <span>{val.toLocaleString()} Unique Visitors</span>
      </p>
    </div>
  );
}

function CustomEngagementTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-2xl border border-admin-border bg-white/95 p-3.5 shadow-xl backdrop-blur-md min-w-[170px]">
      <p className="text-[11px] font-bold text-admin-muted uppercase tracking-wider pb-1.5 border-b border-admin-border/60">{formatLongDate(label)}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-admin-text">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-extrabold text-admin-text">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomProductTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl border border-admin-border bg-white/95 p-3.5 shadow-xl backdrop-blur-md min-w-[180px]">
      <p className="text-xs font-bold text-admin-text truncate max-w-[200px]">{data.name}</p>
      <p className="mt-1.5 text-xs font-extrabold text-admin-primary flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5 text-admin-primary" />
        <span>{data.views.toLocaleString()} Page Views</span>
      </p>
    </div>
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function currency(value) {
  return `₹${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function waLinkFor(phone, message) {
  const digits = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const QUICK_ACTIONS = [
  { label: 'New Order', to: '/admin/orders', icon: ClipboardList },
  { label: 'Add Product', to: '/admin/products', icon: Plus },
  { label: 'Add Category', to: '/admin/categories', icon: Tags },
  { label: 'Upload Gallery', to: '/admin/gallery', icon: Images },
  { label: 'Upload Banner', to: '/admin/banners', icon: GalleryHorizontal },
  { label: 'Create Offer', to: '/admin/offers', icon: BadgePercent },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [productMap, setProductMap] = useState({});
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      getDashboard(),
      messagesApi.list({ status: 'NEW', page: 1, pageSize: 1 }).catch(() => ({ total: 0 })),
      productsApi.list({ page: 1, pageSize: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([dashboard, messages, products]) => {
        setStats(dashboard);
        setUnreadMessages(messages.total || 0);
        const map = {};
        products.items.forEach((p) => {
          map[p.id] = p;
        });
        setProductMap(map);
      })
      .catch((err) => {
        setError(err.message);
        showToast('Failed to load dashboard data.', 'error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derived = useMemo(() => {
    if (!stats) return null;
    const visitorsSeries = stats.visitorsSeries;
    const clicksSeries = stats.clicksSeries;
    const last = visitorsSeries[visitorsSeries.length - 1] || { count: 0 };
    const prevDay = visitorsSeries[visitorsSeries.length - 2] || { count: 0 };
    const lastClicks = clicksSeries[clicksSeries.length - 1] || { orderClicks: 0, whatsappClicks: 0, callClicks: 0 };
    const prevClicks = clicksSeries[clicksSeries.length - 2] || { orderClicks: 0, whatsappClicks: 0, callClicks: 0 };

    const weekVisitors = visitorsSeries.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const conversionRate = stats.cards.totalVisitors > 0 ? (stats.cards.orderClicks / stats.cards.totalVisitors) * 100 : 0;

    return {
      visitorsToday: last.count,
      visitorsTrend: trendPct(last.count, prevDay.count),
      orderClicksToday: lastClicks.orderClicks,
      orderClicksTrend: trendPct(lastClicks.orderClicks, prevClicks.orderClicks),
      whatsappClicksToday: lastClicks.whatsappClicks,
      whatsappClicksTrend: trendPct(lastClicks.whatsappClicks, prevClicks.whatsappClicks),
      callClicksTrend: trendPct(lastClicks.callClicks, prevClicks.callClicks),
      weekVisitors,
      conversionRate,
      visitorsSparkline: visitorsSeries.slice(-14).map((d) => ({ value: d.count })),
      orderClicksSparkline: clicksSeries.slice(-14).map((d) => ({ value: d.orderClicks })),
      whatsappSparkline: clicksSeries.slice(-14).map((d) => ({ value: d.whatsappClicks })),
      callSparkline: clicksSeries.slice(-14).map((d) => ({ value: d.callClicks })),
    };
  }, [stats]);

  if (error && !stats) {
    return (
      <div className="rounded-admin border border-admin-border bg-admin-card p-8 text-center">
        <p className="font-semibold text-admin-danger">Couldn't load the dashboard</p>
        <p className="mt-1 text-sm text-admin-muted">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Skeleton theme="admin" className="h-44" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton theme="admin" key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton theme="admin" key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton theme="admin" className="h-80 lg:col-span-2" />
          <Skeleton theme="admin" className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton theme="admin" className="h-80" />
          <Skeleton theme="admin" className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Title */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-admin-primary">Overview</p>
          <h1 className="font-display text-3xl font-semibold text-admin-text">Dashboard</h1>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-sm font-semibold text-admin-text transition-colors hover:bg-admin-bg"
        >
          <Globe className="h-4 w-4 text-admin-primary" /> View Website
        </a>
      </motion.div>

      {/* Hero: Today's Snapshot */}
      <motion.div
        variants={itemVariants}
        className="relative min-w-0 overflow-hidden rounded-admin border border-admin-border bg-linear-to-br from-admin-primary to-admin-primary-hover p-4.5 text-white shadow-lg sm:p-6 md:p-8"
      >
        <Sparkles className="absolute -right-6 -top-6 h-32 w-32 text-white/10" />
        <p className="text-sm font-medium uppercase tracking-wide text-white/80">Today's Business Overview</p>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Visitors Today</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              <AnimatedNumber value={derived.visitorsToday} />
            </p>
            <div className="mt-1 flex items-center gap-2">
              <TrendBadgeLight trend={derived.visitorsTrend} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Order Clicks Today</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              <AnimatedNumber value={derived.orderClicksToday} />
            </p>
            <TrendBadgeLight trend={derived.orderClicksTrend} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">WhatsApp Clicks Today</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              <AnimatedNumber value={derived.whatsappClicksToday} />
            </p>
            <TrendBadgeLight trend={derived.whatsappClicksTrend} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-white/80">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Unread Messages</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              <AnimatedNumber value={unreadMessages} />
            </p>
            <p className="text-xs text-white/70">Needs your attention</p>
          </div>
        </div>
      </motion.div>

      {/* Order overview */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-3 font-display text-lg font-semibold text-admin-text">Order Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total Orders" value={stats.orders.total} />
          <StatCard icon={Clock} label="Pending" value={stats.orders.pending} />
          <StatCard icon={ChefHat} label="Preparing" value={stats.orders.preparing} />
          <StatCard icon={PackageCheck} label="Ready" value={stats.orders.ready} />
          <StatCard icon={CheckCircle2} label="Delivered" value={stats.orders.delivered} />
          <StatCard icon={XCircle} label="Cancelled" value={stats.orders.cancelled} />
          <StatCard icon={IndianRupee} label="Today's Revenue" value={stats.orders.todayRevenue} format={currency} />
          <StatCard icon={IndianRupee} label="Monthly Revenue" value={stats.orders.monthlyRevenue} format={currency} />
        </div>
      </motion.div>

      {/* Order reminders */}
      <motion.div variants={itemVariants} className="min-w-0 rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-admin-primary" />
          <h2 className="font-display text-lg font-semibold text-admin-text">Order Reminders</h2>
        </div>
        {stats.orderReminders.today.length === 0 && stats.orderReminders.upcoming.length === 0 ? (
          <EmptyState message="No pickups or deliveries scheduled in the next 48 hours." />
        ) : (
          <div className="mt-4 space-y-6">
            {stats.orderReminders.today.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Today</p>
                <div className="mt-2 space-y-2">
                  {stats.orderReminders.today.map((r) => (
                    <ReminderRow key={r.id} reminder={r} />
                  ))}
                </div>
              </div>
            )}
            {stats.orderReminders.upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-admin-muted">Upcoming</p>
                <div className="mt-2 space-y-2">
                  {stats.orderReminders.upcoming.map((r) => (
                    <ReminderRow key={r.id} reminder={r} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Total Visitors" value={stats.cards.totalVisitors} trend={derived.visitorsTrend} sparklineData={derived.visitorsSparkline} color="#D94C7B" />
        <KpiCard icon={ShoppingBag} label="Order Clicks" value={stats.cards.orderClicks} trend={derived.orderClicksTrend} sparklineData={derived.orderClicksSparkline} color="#22C55E" />
        <KpiCard icon={MessageCircle} label="WhatsApp Leads" value={stats.cards.whatsappClicks} trend={derived.whatsappClicksTrend} sparklineData={derived.whatsappSparkline} color="#F59E0B" />
        <KpiCard icon={Phone} label="Call Clicks" value={stats.cards.callClicks} trend={derived.callClicksTrend} sparklineData={derived.callSparkline} color="#3B82F6" />
      </motion.div>

      {/* Large area chart + summary */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 overflow-hidden rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-admin-text">Visitor Traffic — Last 30 Days</h2>
          <div className="mt-4 h-72 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.visitorsSeries}>
                <defs>
                  <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D94C7B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D94C7B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2D7E1" vertical={false} opacity={0.7} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: '#7B7B7B' }}
                  interval={isMobile ? 9 : 6}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#7B7B7B' }} allowDecimals={false} axisLine={false} tickLine={false} width={isMobile ? 28 : 50} />
                <Tooltip content={<CustomTrafficTooltip />} cursor={{ stroke: '#D94C7B', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Visitors"
                  stroke="#D94C7B"
                  strokeWidth={3}
                  fill="url(#visitorsFill)"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#D94C7B' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="font-display text-lg font-semibold text-admin-text">Visitor Summary</h2>
          <div className="mt-4 space-y-4">
            {[
              ['Today', derived.visitorsToday],
              ['This Week', derived.weekVisitors],
              ['This Month', stats.cards.visitorsMonth],
              ['All Time', stats.cards.totalVisitors],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-admin-border pb-3 last:border-0">
                <span className="text-sm text-admin-muted">{label}</span>
                <span className="text-lg font-semibold text-admin-text">
                  <AnimatedNumber value={value} />
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl bg-admin-primary/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-admin-primary">
                <Percent className="h-4 w-4" /> Conversion Rate
              </span>
              <span className="text-lg font-semibold text-admin-primary">{derived.conversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Engagement trend + Top viewed products */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="font-display text-lg font-semibold text-admin-text">Engagement Trend</h2>
          <p className="text-xs text-admin-muted">Order, WhatsApp &amp; call clicks — last 30 days</p>
          <div className="mt-4 h-72 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.clicksSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2D7E1" vertical={false} opacity={0.7} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: '#7B7B7B' }}
                  interval={isMobile ? 9 : 6}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#7B7B7B' }} allowDecimals={false} axisLine={false} tickLine={false} width={isMobile ? 28 : 50} />
                <Tooltip content={<CustomEngagementTooltip />} cursor={{ stroke: '#D94C7B', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="orderClicks" name="Order Clicks" stroke="#D94C7B" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="whatsappClicks" name="WhatsApp" stroke="#22C55E" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="callClicks" name="Calls" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="font-display text-lg font-semibold text-admin-text">Top Viewed Products</h2>
          <p className="text-xs text-admin-muted">By product page views</p>
          <div className="mt-4 h-72 w-full min-w-0 overflow-hidden">
            {stats.topProducts.length === 0 ? (
              <EmptyState message="Not enough product views yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 10, right: 45, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barGrad0" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#D94C7B" />
                      <stop offset="100%" stopColor="#F43F5E" />
                    </linearGradient>
                    <linearGradient id="barGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E11D48" />
                      <stop offset="100%" stopColor="#FB7185" />
                    </linearGradient>
                    <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#BE185D" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                    <linearGradient id="barGrad3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                    <linearGradient id="barGrad4" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0284C7" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2D7E1" horizontal={false} opacity={0.6} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7B7B7B' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={isMobile ? 95 : 145}
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomBarYAxisTick />}
                  />
                  <Tooltip content={<CustomProductTooltip />} cursor={{ fill: 'rgba(217,76,123,0.06)', radius: 10 }} />
                  <Bar
                    dataKey="views"
                    name="Views"
                    background={{ fill: 'rgba(242, 215, 225, 0.25)', radius: [0, 10, 10, 0] }}
                    radius={[0, 10, 10, 0]}
                    maxBarSize={24}
                  >
                    {stats.topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#barGrad${index % 5})`} />
                    ))}
                    <LabelList
                      dataKey="views"
                      position="right"
                      formatter={(val) => `${val}`}
                      style={{ fill: '#D94C7B', fontSize: 11, fontWeight: 800, dx: 6 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

      {/* Compact stat row */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard icon={Images} label="Gallery Views" value={stats.cards.galleryViews} />
        <StatCard icon={Eye} label="Product Views" value={stats.cards.productViews} />
        <StatCard icon={Mail} label="Unread Messages" value={unreadMessages} />
      </motion.div>

      {/* Popular products + Quick actions */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-admin-text">Popular Products</h2>
          {stats.topProducts.length === 0 ? (
            <EmptyState message="No product views recorded yet." />
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {stats.topProducts.map((p, index) => {
                const product = productMap[p.productId];
                const imageSrc = product?.image || p.image;
                return (
                  <div
                    key={p.productId}
                    className="flex items-center gap-3.5 rounded-2xl border border-admin-border bg-admin-card p-3.5 shadow-2xs"
                  >
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={p.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover bg-admin-bg"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-admin-bg text-admin-muted">
                        <Cake className="h-5 w-5 text-admin-muted" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-admin-text">{p.name}</p>
                      <p className="truncate text-xs text-admin-muted mt-0.5">
                        {product?.category?.name || 'Uncategorised'}
                      </p>
                      {product?.status && (
                        <div className="mt-1.5">
                          <StatusBadge status={product.status} />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-admin-muted whitespace-nowrap">
                        #{index + 1} · {p.views} views
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
          <h2 className="font-display text-lg font-semibold text-admin-text">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-admin-border bg-admin-card p-4 text-center text-xs font-semibold text-admin-text transition-all hover:border-admin-primary hover:bg-admin-primary/5 active:scale-98 shadow-2xs"
              >
                <action.icon className="h-5 w-5 text-admin-primary" />
                <span className="leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={itemVariants} className="min-w-0 rounded-admin border border-admin-border bg-admin-card p-4.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
        <h2 className="font-display text-lg font-semibold text-admin-text">Recent Activity</h2>
        <div className="mt-4">
          <ActivityTimeline items={stats.recentActivity} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrendBadgeLight({ trend }) {
  if (typeof trend !== 'number' || !Number.isFinite(trend)) return null;
  const isUp = trend >= 0;
  return (
    <span className="mt-1 flex items-center gap-0.5 text-xs font-semibold text-white/85">
      {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(trend).toFixed(0)}% vs yesterday
    </span>
  );
}

function ReminderRow({ reminder }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-colors duration-200 hover:bg-admin-bg/60 ${
        reminder.urgent ? 'border-admin-danger/40 bg-admin-danger/5' : 'border-admin-border'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            reminder.urgent ? 'bg-admin-danger/10 text-admin-danger' : 'bg-admin-primary/10 text-admin-primary'
          }`}
        >
          {reminder.orderType === 'DELIVERY' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-admin-text">
            {reminder.customerName} <span className="text-admin-muted">· {reminder.productName}</span>
          </p>
          <p className="flex items-center gap-1 text-xs text-admin-muted">
            {reminder.urgent && <AlertTriangle className="h-3.5 w-3.5 text-admin-danger" />}
            <span className={reminder.urgent ? 'font-semibold text-admin-danger' : ''}>{formatTime(reminder.pickupDatetime)}</span>
            <span>· {reminder.orderNumber}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${reminder.phone}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
          aria-label="Call customer"
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
        <a
          href={waLinkFor(reminder.phone, `Hi ${reminder.customerName}, following up on your order ${reminder.orderNumber}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border text-admin-text hover:bg-admin-bg"
          aria-label="Message on WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
        <Link
          to="/admin/orders"
          className="rounded-full border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-text hover:bg-admin-bg"
        >
          View
        </Link>
      </div>
    </div>
  );
}
