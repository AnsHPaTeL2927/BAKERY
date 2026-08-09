import { motion } from "framer-motion";

// Enhanced page header with entrance animations and decorative elements.
export default function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="relative bg-blush-soft border-b border-blush overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blush/30 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-rose/10 blur-2xl" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-script text-2xl md:text-3xl text-rose-deep mb-2"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-semibold text-3xl md:text-5xl text-cocoa"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-cocoa-soft/80 max-w-xl mx-auto text-lg"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
