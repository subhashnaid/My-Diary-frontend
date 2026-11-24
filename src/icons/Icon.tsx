import React from 'react';
import { ICONS, IconName } from './icons';
import { SVG_ICONS } from './svgData';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

export function resolveIconGlyphName(name: IconName): string {
  if (name in ICONS) {
    return ICONS[name as keyof typeof ICONS];
  }
  return name as string;
}

/**
 * Web Icon component: Inlines exact SVG from svg/ui using currentColor.
 * Provides accessible attributes, zero layout shift, and instant rendering.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = 'currentColor',
  className = '',
  style = {},
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  ...props
}) => {
  const glyphName = resolveIconGlyphName(name);
  const innerSvg = SVG_ICONS[glyphName] || SVG_ICONS['sparkles-outline'] || '';

  const isDecorative = !ariaLabel && ariaHidden !== false;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`mydiary-icon ${className}`.trim()}
      style={{
        color,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden={isDecorative ? 'true' : undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : 'presentation'}
      dangerouslySetInnerHTML={{ __html: innerSvg }}
      {...props}
    />
  );
};
