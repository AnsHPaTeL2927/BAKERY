import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

// Wraps route content with a fade + subtle translateY page transition.
// Duration ~400ms, does not block navigation or break back/forward.
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1], // expo-out
};

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
