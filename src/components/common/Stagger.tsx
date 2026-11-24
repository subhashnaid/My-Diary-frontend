import React from 'react';
import { FadeIn } from './FadeIn';

export interface StaggerProps {
  delayStep?: number; // Milliseconds between items (default 80ms)
  baseDelay?: number; // Starting delay (default 0ms)
  maxChildren?: number; // Capped children count (default 6)
  className?: string;
  as?: React.ElementType;
  reveal?: boolean;
  children: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({
  delayStep = 80,
  baseDelay = 0,
  maxChildren = 6,
  className = '',
  as: Component = 'div',
  reveal = false,
  children,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <Component className={`motion-stagger ${className}`.trim()}>
      {childArray.map((child, index) => {
        // Cap the delay increase at maxChildren (e.g. 6 items)
        const effectiveIndex = Math.min(index, maxChildren - 1);
        const itemDelay = baseDelay + effectiveIndex * delayStep;

        if (React.isValidElement(child)) {
          return (
            <FadeIn key={child.key || index} delay={itemDelay} reveal={reveal}>
              {child}
            </FadeIn>
          );
        }

        return child;
      })}
    </Component>
  );
};
