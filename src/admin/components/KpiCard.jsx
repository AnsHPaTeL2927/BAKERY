import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

export default function KpiCard({ icon: Icon, label, value, trend, sparklineData, color = '#D94C7B' }) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend);
  const isUp = trend >= 0;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px -20px rgba(217,76,123,0.25)' }}
      transition={{ duration: 0.2 }}
      className="rounded-admin border border-admin-border bg-admin-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-admin-primary/10">
          <Icon className="h-5 w-5 text-admin-primary" />
        </div>
        {hasTrend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold ${
              isUp ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-danger/10 text-admin-danger'
            }`}
          >
            {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-admin-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-admin-text">
        <AnimatedNumber value={value} />
      </p>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </motion.div>
  );
}
