import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// "Darkroom develop" reveal — the photo resolves like a print in developer
// fluid: washed-out, warm, and soft, then settles into full contrast and
// sharpness. Filter strings must keep the same function order to interpolate.
const UNDEVELOPED = 'blur(14px) brightness(1.4) contrast(0.65) sepia(0.35) saturate(0.65)';
const DEVELOPED = 'blur(0px) brightness(1) contrast(1) sepia(0) saturate(1)';

export default function RevealImage({ src, alt, className = '', style = {}, priority = false, onClick }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(priority);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (priority) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [priority]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={style} onClick={onClick}>
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className="block h-full w-full object-cover"
        initial={shouldReduce ? false : { opacity: 0, filter: UNDEVELOPED, scale: 1.03 }}
        animate={
          inView
            ? { opacity: 1, filter: DEVELOPED, scale: 1 }
            : {}
        }
        transition={{
          opacity: { duration: 0.35, ease: 'easeOut' },
          filter: { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] },
          scale: { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] },
        }}
      />
    </div>
  );
}
