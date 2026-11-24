import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Entries Found',
  description = 'Your journal is waiting for your thoughts and memories.',
  className = '',
}) => {
  return (
    <div
      className={`empty-state-card ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <img
        src="/svg/illustrations/empty-state.svg"
        alt="Empty State Illustration"
        width={130}
        height={130}
        className="float-illustration"
        style={{ marginBottom: '1.25rem' }}
      />
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', margin: 0, maxWidth: '340px' }}>
        {description}
      </p>
    </div>
  );
};
