import { motion } from 'framer-motion';
import {
  LogIn,
  LogOut,
  Tags,
  Cake,
  Images,
  BadgePercent,
  GalleryHorizontal,
  MessageSquareQuote,
  Settings,
  Mail,
  Activity,
} from 'lucide-react';
import { formatRelativeTime } from '../utils/time';

const ICON_BY_PREFIX = [
  [/^LOGIN_SUCCESS/, LogIn],
  [/^LOGIN_FAILED/, LogIn],
  [/^LOGOUT/, LogOut],
  [/^CATEGORY_/, Tags],
  [/^PRODUCT_/, Cake],
  [/^GALLERY_/, Images],
  [/^OFFER_/, BadgePercent],
  [/^BANNER_/, GalleryHorizontal],
  [/^TESTIMONIAL_/, MessageSquareQuote],
  [/^SETTINGS_/, Settings],
  [/^MESSAGE_/, Mail],
];

function iconFor(action) {
  const match = ICON_BY_PREFIX.find(([pattern]) => pattern.test(action));
  return match ? match[1] : Activity;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

export default function ActivityTimeline({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-admin-muted">
        <Activity className="h-8 w-8 opacity-40" />
        <p className="text-sm">No activity yet — actions you take in the admin panel will show up here.</p>
      </div>
    );
  }

  return (
    <motion.ul variants={listVariants} initial="hidden" animate="show" className="relative space-y-5">
      <div className="absolute bottom-2 left-[19px] top-2 w-px bg-admin-border" aria-hidden="true" />
      {items.map((item) => {
        const Icon = iconFor(item.action);
        return (
          <motion.li key={item.id} variants={itemVariants} className="relative flex items-start gap-4">
            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-admin-border bg-admin-card text-admin-primary shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 pt-1.5">
              <p className="text-sm text-admin-text">
                <span className="font-semibold">{item.adminName}</span>{' '}
                <span className="text-admin-muted">{item.action.replaceAll('_', ' ').toLowerCase()}</span>
              </p>
              <p className="text-xs text-admin-muted" title={new Date(item.createdAt).toLocaleString()}>
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
