import React from 'react';
import { MOODS, MoodKey, MOOD_STYLE, MoodStyle } from '../../icons/icons';
import { Icon } from '../../icons/Icon';

export interface MoodBadgeProps {
  moodKey: string;
  selected?: boolean;
  size?: number; // e.g. 36 in selector, 24 in cards
  showLabel?: boolean;
  onClick?: () => void;
  styleMode?: MoodStyle;
  className?: string;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({
  moodKey,
  selected = false,
  size = 36,
  showLabel = false,
  onClick,
  styleMode = MOOD_STYLE,
  className = '',
}) => {
  const normalizedKey = (moodKey.toLowerCase() in MOODS
    ? moodKey.toLowerCase()
    : 'happy') as MoodKey;
  const mood = MOODS[normalizedKey];

  const glyphSize = Math.round(size * 0.55);

  const ringStyle: React.CSSProperties = selected
    ? {
        boxShadow: `0 0 0 3px var(--surface, #ffffff), 0 0 0 5px ${mood.color}`,
        transition: 'box-shadow 150ms cubic-bezier(0.2, 0.7, 0.3, 1), transform 150ms cubic-bezier(0.2, 0.7, 0.3, 1)',
        transform: 'scale(1.06)',
      }
    : {
        transition: 'box-shadow 150ms cubic-bezier(0.2, 0.7, 0.3, 1), transform 150ms cubic-bezier(0.2, 0.7, 0.3, 1)',
      };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Mood ${mood.label}`}
      aria-pressed={onClick ? selected : undefined}
      className={`mood-badge-container ${onClick ? 'mood-badge-clickable' : ''} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: onClick ? 44 : undefined,
        minHeight: onClick ? 44 : undefined,
        userSelect: 'none',
      }}
    >
      <div
        className="mood-badge-circle"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: mood.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          ...ringStyle,
        }}
      >
        {styleMode === 'emoji' ? (
          <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{mood.emoji}</span>
        ) : (
          <Icon name={mood.icon as any} size={glyphSize} color="#ffffff" aria-hidden="true" />
        )}
      </div>

      {showLabel && (
        <span
          style={{
            marginTop: 6,
            fontSize: '0.8rem',
            fontWeight: selected ? 700 : 500,
            color: selected ? mood.color : 'var(--text-main)',
          }}
        >
          {mood.label}
        </span>
      )}
    </div>
  );
};
