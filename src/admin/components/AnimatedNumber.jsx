import { useEffect, useRef } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';

export default function AnimatedNumber({ value = 0, duration = 0.8, format }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const spanRef = useRef(null);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (spanRef.current) {
        spanRef.current.textContent = format ? format(v) : v.toLocaleString();
      }
    });
    return unsubscribe;
  }, [rounded, format]);

  return <span ref={spanRef}>{format ? format(0) : '0'}</span>;
}
