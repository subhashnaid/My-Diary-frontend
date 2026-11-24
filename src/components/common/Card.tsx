import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  interactive?: boolean; // When true, applies pressable hover lift & active scale
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  as: Component = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const interactiveClass = interactive ? 'pressable-card' : '';

  return (
    <Component
      className={`card ${interactiveClass} ${className}`.trim()}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};
