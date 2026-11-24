import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { diaryApi } from '../api/diary';
import { DiaryEntry } from '../types/diary';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../icons/Icon';
import { BRAND, MOODS, MoodKey, MOOD_STYLE } from '../icons/icons';
import { MoodBadge } from '../components/common/MoodBadge';
import { BadgeCard } from '../components/common/BadgeCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FadeIn } from '../components/common/FadeIn';
import { Stagger } from '../components/common/Stagger';
import { CountUp } from '../components/common/CountUp';
import { GrowBar } from '../components/common/GrowBar';
import { Skeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';
import { Toast, ToastProps } from '../components/common/Toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Confirmation Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodKey>('grateful');

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await diaryApi.getEntries();
      setEntries(data);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to load entries',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !content) return;

    try {
      setSaving(true);
      const formattedContent = `[Mood: ${MOODS[selectedMood].label}]\n${content}`;
      await diaryApi.createEntry({ title, content: formattedContent, entry_date: date });

      setTitle('');
      setContent('');
      setDate(todayStr);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2200);

      setToast({
        type: 'success',
        message: 'Your memory has been safely recorded.',
      });

      await loadEntries();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to save entry',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await diaryApi.deleteEntry(deleteId);
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
      setToast({
        type: 'info',
        message: 'Memory removed from your journal.',
      });
      setDeleteId(null);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete entry',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered entries for search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Stats calculation
  const currentMonthEntries = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return entries.filter((e) => {
      const d = new Date(e.entry_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [entries]);

  const monthGoalPercent = Math.min(100, Math.round((currentMonthEntries / 15) * 100));

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="dashboard-container">
      {/* Toast Notification Container */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* 1. Greeting and Date Header */}
      <FadeIn delay={0}>
        <div className="dashboard-hero">
          <div>
            <h1 className="hero-title">
              Welcome back, {user?.username || 'Writer'}
            </h1>
            <p className="hero-date">{formattedDate}</p>
          </div>
          <div className="hero-icon-pill" aria-hidden="true">
            <Icon name="sparkle" size={22} color={BRAND.primary} />
          </div>
        </div>
      </FadeIn>

      {/* 2. Prompt Card / Create Card */}
      <FadeIn delay={120}>
        <section className="create-card">
          <div className="section-header">
            <Icon name="add" size={22} color={BRAND.primary} aria-hidden="true" />
            <h2>Write Today's Memory</h2>
          </div>

          <form onSubmit={handleCreate} className="entry-form">
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="title">Entry Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="What was meaningful today?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Step 4 Upgrade: Mood selector as solid circle in color with white glyph, 2px ring offset 3px */}
            <div className="form-group">
              <label>How are you feeling today?</label>
              <div className="mood-selector" style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(Object.keys(MOODS) as MoodKey[]).map((key) => (
                  <MoodBadge
                    key={key}
                    moodKey={key}
                    selected={selectedMood === key}
                    size={38}
                    showLabel={true}
                    onClick={() => setSelectedMood(key)}
                    styleMode={MOOD_STYLE}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="content">Thoughts & Reflections</label>
              <textarea
                id="content"
                rows={4}
                placeholder="Pen down your honest thoughts, reflections and gratitude..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                glow={!saving && !saveSuccess}
                loading={saving}
              >
                {saveSuccess ? (
                  <>
                    <Icon name="saved" size={18} color="#ffffff" className="check-icon-pop" aria-hidden="true" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Icon name="edit" size={18} color="#ffffff" aria-hidden="true" />
                    <span>Record Memory</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </FadeIn>

      {/* 3. Stats Row with CountUp and GrowBar */}
      <FadeIn delay={240}>
        <div className="stats-grid">
          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon name="diary" size={18} color={BRAND.primary} aria-hidden="true" />
              <span className="stat-label">Total Memories</span>
            </div>
            <span className="stat-value">
              <CountUp to={entries.length} />
            </span>
            <span className="stat-helper">All-time captured moments</span>
          </Card>

          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon name="calendar" size={18} color={BRAND.primary} aria-hidden="true" />
              <span className="stat-label">This Month</span>
            </div>
            <span className="stat-value">
              <CountUp to={currentMonthEntries} />
            </span>
            <span className="stat-helper">Target: 15 entries</span>
          </Card>

          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="streak" size={18} color="#f97316" aria-hidden="true" />
                <span className="stat-label">Monthly Goal</span>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {monthGoalPercent}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--border)',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginTop: '0.6rem',
                marginBottom: '0.4rem',
              }}
            >
              <GrowBar value={monthGoalPercent} delay={300} />
            </div>
            <span className="stat-helper" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="achievement" size={14} color="var(--text-muted)" aria-hidden="true" />
              <span>Consistency tracker</span>
            </span>
          </Card>
        </div>
      </FadeIn>

      {/* Step 4 Upgrade: Milestone Badges Section (svg/badges) */}
      <FadeIn delay={300}>
        <section className="milestones-section">
          <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="achievement" size={22} color={BRAND.primary} aria-hidden="true" />
              <h2>Milestones & Badges</h2>
            </div>
            <Link to="/stats" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
              View Insights →
            </Link>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
            }}
          >
            <BadgeCard
              id="streak"
              title="On Fire"
              subtitle="3-day streak"
              unlocked={entries.length >= 3}
            />
            <BadgeCard
              id="first-entry"
              title="First Memory"
              subtitle="Written 1st entry"
              unlocked={entries.length >= 1}
            />
            <BadgeCard
              id="week-goal"
              title="7-Day Goal"
              subtitle="Full week logged"
              unlocked={entries.length >= 7}
            />
            <BadgeCard
              id="thirty-entries"
              title="30 Entries"
              subtitle="Monthly master"
              unlocked={entries.length >= 30}
            />
          </div>
        </section>
      </FadeIn>

      {/* 4. Diary Entries List Header & Search */}
      <section className="entries-section">
        <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="diary" size={22} color={BRAND.primary} aria-hidden="true" />
            <h2>Recent Memories</h2>
            <span className="entry-badge">{filteredEntries.length} Entries</span>
          </div>
          <Link to="/diary" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
            Open Full Journal →
          </Link>
        </div>

        {/* Search bar with subtle focus transitions */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="search" size={18} aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search through your entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              paddingTop: '0.65rem',
              paddingBottom: '0.65rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* Loading skeleton placeholders */}
        {loading ? (
          <div className="entries-grid">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width={120} height={18} />
                  <Skeleton width={24} height={24} rounded="sm" />
                </div>
                <Skeleton width="60%" height={24} />
                <Skeleton width="100%" height={16} />
                <Skeleton width="85%" height={16} />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          /* Step 4 Upgrade: Empty state illustration (svg/illustrations/empty-state.svg) */
          <div className="empty-state">
            <EmptyState
              title={searchQuery ? 'No Matching Entries' : 'Your Diary is Fresh'}
              description={
                searchQuery
                  ? 'Try searching with different keywords or clear the filter.'
                  : 'Start capturing your daily thoughts, reflections, and memories above!'
              }
            />
          </div>
        ) : (
          /* Staggered entries */
          <Stagger
            delayStep={80}
            baseDelay={0}
            maxChildren={6}
            reveal={true}
            className="entries-grid"
          >
            {filteredEntries.map((entry) => (
              <Card key={entry.id} as="article" className="entry-card" interactive>
                <div className="entry-card-header">
                  <span className="entry-date">
                    <Icon name="calendar" size={14} aria-hidden="true" />
                    <span>
                      {new Date(entry.entry_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                  <button
                    onClick={() => setDeleteId(entry.id)}
                    className="btn-icon-danger"
                    title="Delete entry"
                    aria-label={`Delete entry: ${entry.title}`}
                  >
                    <Icon name="delete" size={18} color="currentColor" aria-hidden="true" />
                  </button>
                </div>
                <h3 className="entry-title">{entry.title}</h3>
                <p className="entry-content">{entry.content}</p>
              </Card>
            ))}
          </Stagger>
        )}
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        title="Delete Memory"
        description="Are you sure you want to permanently delete this memory? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
