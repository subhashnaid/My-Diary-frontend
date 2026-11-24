import React, { useRef, useLayoutEffect, useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'icon';
  loading?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  glow = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  // Preserve width during loading so button doesn't shrink or cause layout shift
  useLayoutEffect(() => {
    if (buttonRef.current && !loading) {
      setMinWidth(buttonRef.current.offsetWidth);
    }
  }, [children, loading]);

  const variantClass = `btn-${variant}`;
  const glowClass = glow ? 'btn-glow' : '';
  const loadingClass = loading ? 'btn-loading' : '';

  return (
    <button
      ref={buttonRef}
      className={`btn pressable ${variantClass} ${glowClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      style={{ minWidth: minWidth ? `${minWidth}px` : undefined }}
      {...props}
    >
      {loading ? (
        <span className="spinner-sm" aria-label="Loading..." />
      ) : (
        children
      )}
    </button>
  );
};
