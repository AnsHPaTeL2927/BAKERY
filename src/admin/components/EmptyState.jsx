import { Sparkles } from 'lucide-react';

export default function EmptyState({ icon: Icon = Sparkles, title, message, actionLabel, onAction }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center text-admin-muted">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-primary/10">
        <Icon className="h-6 w-6 text-admin-primary/70" />
      </div>
      {title && <p className="font-display text-base font-semibold text-admin-text">{title}</p>}
      <p className="text-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-white hover:bg-admin-primary-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
