import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface GrowBarProps {
  value: number; // 0 to 100 percentage
  vertical?: boolean;
  delay?: number; // Milliseconds
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GrowBar: React.FC<GrowBarProps> = ({
  value,
  vertical = false,
  delay = 0,
  color,
  className = '',
  style = {},
}) => {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState<boolean>(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => {
      setMounted(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, reducedMotion]);

  const clampedValue = Math.max(0, Math.min(100, value));

  const barStyle: React.CSSProperties = {
    backgroundColor: color || 'var(--primary, #4f46e5)',
    ...(vertical
      ? {
          width: '100%',
          height: `${clampedValue}%`,
          transformOrigin: 'bottom',
          transform: mounted || reducedMotion ? 'scaleY(1)' : 'scaleY(0)',
          transition: reducedMotion
            ? 'none'
            : 'transform var(--dur-slow, 750ms) var(--ease-out, cubic-bezier(0.2, 0.7, 0.3, 1))',
        }
      : {
          height: '100%',
          width: `${clampedValue}%`,
          transformOrigin: 'left',
          transform: mounted || reducedMotion ? 'scaleX(1)' : 'scaleX(0)',
          transition: reducedMotion
            ? 'none'
            : 'transform var(--dur-slow, 750ms) var(--ease-out, cubic-bezier(0.2, 0.7, 0.3, 1))',
        }),
    willChange: 'transform',
    ...style,
  };

  return (
    <div className={`grow-bar-track ${vertical ? 'vertical' : 'horizontal'} ${className}`.trim()}>
      <div className="grow-bar-fill" style={barStyle} />
    </div>
  );
};
