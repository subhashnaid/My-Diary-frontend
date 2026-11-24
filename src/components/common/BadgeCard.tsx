import React from 'react';

export type BadgeId = 'first-entry' | 'streak' | 'week-goal' | 'thirty-entries';

interface BadgeCardProps {
  id: BadgeId;
  title: string;
  subtitle: string;
  unlocked?: boolean;
}

const BADGE_SVGS: Record<BadgeId, string> = {
  'first-entry': '/svg/badges/badge-first-entry.svg',
  'streak': '/svg/badges/badge-streak.svg',
  'week-goal': '/svg/badges/badge-week-goal.svg',
  'thirty-entries': '/svg/badges/badge-thirty-entries.svg',
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  id,
  title,
  subtitle,
  unlocked = true,
}) => {
  return (
    <div
      className="badge-card"
      style={{
        width: 124,
        padding: '0.75rem 0.6rem',
        borderRadius: 'var(--radius, 12px)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: unlocked ? 1 : 0.45,
        filter: unlocked ? 'none' : 'grayscale(1)',
        transition: 'transform var(--dur-fast, 150ms) var(--ease-out)',
      }}
    >
      <img
        src={BADGE_SVGS[id]}
        alt={title}
        width={48}
        height={48}
        style={{ marginBottom: '0.45rem' }}
      />
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
        {subtitle}
      </p>
    </div>
  );
};
