import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface FadeInProps extends React.HTMLAttributes<HTMLElement> {
  delay?: number; // Delay in milliseconds
  as?: React.ElementType;
  className?: string;
  reveal?: boolean; // If true, triggers when scrolled into viewport using IntersectionObserver
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  as: Component = 'div',
  className = '',
  reveal = false,
  children,
  style = {},
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState<boolean>(!reveal || reducedMotion);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (reducedMotion || !reveal) {
      setIsVisible(true);
      return;
    }

    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Runs once per element
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [reveal, reducedMotion]);

  const animationStyle: React.CSSProperties = reducedMotion
    ? { opacity: 1, transform: 'none', ...style }
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity var(--dur-base, 450ms) var(--ease-out, cubic-bezier(0.2, 0.7, 0.3, 1)), transform var(--dur-base, 450ms) var(--ease-out, cubic-bezier(0.2, 0.7, 0.3, 1))`,
        transitionDelay: `${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      };

  return (
    <Component
      ref={elementRef}
      className={`motion-fade-in ${className}`.trim()}
      style={animationStyle}
      {...props}
    >
      {children}
    </Component>
  );
};
