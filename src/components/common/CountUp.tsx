import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface CountUpProps {
  to: number;
  from?: number;
  suffix?: string;
  prefix?: string;
  duration?: number; // Milliseconds, default 900ms
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  suffix = '',
  prefix = '',
  duration = 900,
  className = '',
}) => {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(reducedMotion ? to : from);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If reduced motion is requested, render final value immediately
    if (reducedMotion) {
      setDisplayValue(to);
      return;
    }

    if (from === to) {
      setDisplayValue(to);
      return;
    }

    let isCancelled = false;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      // Pause if tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - (1 - t)^3
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * easedProgress);

      if (!isCancelled) {
        setDisplayValue(current);
      }

      if (progress < 1 && !isCancelled) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else if (!isCancelled) {
        setDisplayValue(to);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [to, from, duration, reducedMotion]);

  return (
    <span className={`motion-count-up ${className}`.trim()}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
