import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

// Shared compact stat tile — icon, label, value, optional trend badge — used
// on both the Dashboard and the Order module's top stats row so the two
// don't drift into two competing "stat card" designs.
export default function StatCard({ icon: Icon, label, value, format, trend }) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend);
  const isUp = trend >= 0;

  return (
    <div className="flex items-center gap-4 rounded-admin border border-admin-border bg-admin-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-admin-primary/10 text-admin-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-admin-muted">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-admin-text">
            <AnimatedNumber value={value} format={format} />
          </p>
          {hasTrend && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                isUp ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-danger/10 text-admin-danger'
              }`}
            >
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
