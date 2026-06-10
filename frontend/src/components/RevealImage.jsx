import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
      <motion.div
        style={{ width: '100%', height: '100%' }}
        initial={shouldReduce ? false : { clipPath: 'inset(0 0 100% 0)', scale: 1.08 }}
        animate={inView ? { clipPath: 'inset(0 0 0% 0)', scale: 1 } : {}}
        transition={{ duration: 0.9, ease: [0.77, 0, 0.175, 1] }}
      >
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
      </motion.div>
    </div>
  );
}
