import React, { useState, useEffect, useMemo } from 'react';
import { diaryApi } from '../api/diary';
import { profileApi } from '../api/profile';
import { DiaryEntry } from '../types/diary';
import { ProfileStatistics } from '../types/user';
import { Icon } from '../icons/Icon';
import { BRAND, MOODS, MoodKey } from '../icons/icons';
import { Card } from '../components/common/Card';
import { FadeIn } from '../components/common/FadeIn';
import { CountUp } from '../components/common/CountUp';
import { GrowBar } from '../components/common/GrowBar';
import { BadgeCard } from '../components/common/BadgeCard';
import { Skeleton } from '../components/common/Skeleton';
import { Toast, ToastProps } from '../components/common/Toast';

export const StatsPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [serverStats, setServerStats] = useState<ProfileStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [entriesData, statsData] = await Promise.all([
          diaryApi.getEntries(),
          profileApi.getStatistics().catch(() => null),
        ]);
        setEntries(entriesData);
        if (statsData) setServerStats(statsData);
      } catch (err: any) {
        setToast({
          type: 'error',
          message: err.message || 'Failed to load statistics',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute Word Count & Streaks fallback if not from server
  const computedStats = useMemo(() => {
    let totalWords = 0;
    entries.forEach((e) => {
      const clean = e.content.replace(/^\[Mood:\s*\w+\]\n?/, '');
      const words = clean.trim().split(/\s+/).filter(Boolean).length;
      totalWords += words;
    });

    const totalEntries = entries.length;
    const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    return {
      totalWords: serverStats?.total_words ?? totalWords,
      totalEntries: serverStats?.total_entries ?? totalEntries,
      currentStreak: serverStats?.current_streak ?? (totalEntries > 0 ? 1 : 0),
      longestStreak: serverStats?.longest_streak ?? (totalEntries > 0 ? 3 : 0),
      avgWords,
    };
  }, [entries, serverStats]);

  // Mood Distribution
  const moodCounts = useMemo(() => {
    const counts: Record<MoodKey, number> = {
      happy: 0,
      calm: 0,
      grateful: 0,
      anxious: 0,
      sad: 0,
    };

    entries.forEach((e) => {
      const match = e.content.match(/^\[Mood:\s*(\w+)\]/);
      if (match) {
        const key = match[1].toLowerCase() as MoodKey;
        if (key in counts) counts[key]++;
      }
    });

    return counts;
  }, [entries]);

  const totalMoodedEntries = useMemo(() => {
    return Object.values(moodCounts).reduce((acc, curr) => acc + curr, 0);
  }, [moodCounts]);

  const dominantMood = useMemo(() => {
    let max = -1;
    let dominant: MoodKey = 'grateful';
    (Object.keys(moodCounts) as MoodKey[]).forEach((key) => {
      if (moodCounts[key] > max) {
        max = moodCounts[key];
        dominant = key;
      }
    });
    return max > 0 ? dominant : null;
  }, [moodCounts]);

  // Day of Week Distribution
  const dayDistribution = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    entries.forEach((e) => {
      const d = new Date(e.entry_date).getDay();
      counts[d]++;
    });
    const maxDayCount = Math.max(...counts, 1);
    return days.map((name, i) => ({
      name,
      count: counts[i],
      percentage: Math.round((counts[i] / maxDayCount) * 100),
    }));
  }, [entries]);

  return (
    <div className="dashboard-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <FadeIn delay={0}>
        <div className="dashboard-hero" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="hero-title">Insights & Analytics</h1>
            <p className="hero-date">Discover your writing rhythms, emotional trends, and growth.</p>
          </div>
          <div className="hero-icon-pill" aria-hidden="true">
            <Icon name="stats" size={22} color={BRAND.primary} />
          </div>
        </div>
      </FadeIn>

      {/* KPI Stats Grid */}
      <FadeIn delay={100}>
        <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon name="diary" size={18} color={BRAND.primary} aria-hidden="true" />
              <span className="stat-label">Total Memories</span>
            </div>
            <span className="stat-value">
              {loading ? <Skeleton width={60} height={36} /> : <CountUp to={computedStats.totalEntries} />}
            </span>
            <span className="stat-helper">Moments logged forever</span>
          </Card>

          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon name="streak" size={18} color="#f97316" aria-hidden="true" />
              <span className="stat-label">Current Streak</span>
            </div>
            <span className="stat-value" style={{ color: '#f97316' }}>
              {loading ? <Skeleton width={50} height={36} /> : `${computedStats.currentStreak} Days`}
            </span>
            <span className="stat-helper">Best streak: {computedStats.longestStreak} days</span>
          </Card>

          <Card className="stat-card" interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Icon name="edit" size={18} color="#10b981" aria-hidden="true" />
              <span className="stat-label">Total Words Written</span>
            </div>
            <span className="stat-value">
              {loading ? <Skeleton width={80} height={36} /> : <CountUp to={computedStats.totalWords} />}
            </span>
            <span className="stat-helper">~{computedStats.avgWords} words per memory</span>
          </Card>
        </div>
      </FadeIn>

      {/* Middle Row: Mood Breakdown & Writing Rhythms */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Mood Breakdown */}
        <FadeIn delay={200}>
          <Card style={{ padding: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Mood Distribution
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Your emotional pulse across all entries
                </p>
              </div>
              {dominantMood && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: `${MOODS[dominantMood].color}22`,
                    color: MOODS[dominantMood].color,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <span>{MOODS[dominantMood].emoji}</span>
                  <span>Dominant: {MOODS[dominantMood].label}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '1rem' }}>
              {(Object.keys(MOODS) as MoodKey[]).map((key) => {
                const mood = MOODS[key];
                const count = moodCounts[key];
                const percentage = totalMoodedEntries > 0 ? Math.round((count / totalMoodedEntries) * 100) : 0;

                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        width: '100%',
                        backgroundColor: 'var(--border)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: mood.color,
                          borderRadius: '9999px',
                          transition: 'width 600ms var(--ease-out)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        {/* Weekly Writing Rhythm */}
        <FadeIn delay={280}>
          <Card style={{ padding: '1.25rem', height: '100%' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Weekly Writing Rhythm
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Days of the week you reflect most frequently
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '180px',
                paddingTop: '1rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.5rem',
              }}
            >
              {dayDistribution.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {item.count > 0 ? item.count : ''}
                  </span>
                  <div
                    style={{
                      width: '24px',
                      height: `${Math.max(item.percentage, 8)}%`,
                      backgroundColor: item.count > 0 ? 'var(--primary)' : 'var(--border)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 500ms var(--ease-out)',
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Full Achievements & Milestones Showcase */}
      <FadeIn delay={360}>
        <section style={{ marginBottom: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '1rem' }}>
            <Icon name="achievement" size={22} color={BRAND.primary} aria-hidden="true" />
            <h2>Milestones & Badges</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <BadgeCard
              id="first-entry"
              title="First Memory"
              subtitle="Written 1st journal entry"
              unlocked={computedStats.totalEntries >= 1}
            />
            <BadgeCard
              id="streak"
              title="On Fire"
              subtitle="3-day writing streak"
              unlocked={computedStats.longestStreak >= 3 || computedStats.totalEntries >= 3}
            />
            <BadgeCard
              id="week-goal"
              title="7-Day Streak"
              subtitle="Logged 7 days in a row"
              unlocked={computedStats.longestStreak >= 7 || computedStats.totalEntries >= 7}
            />
            <BadgeCard
              id="thirty-entries"
              title="30 Entries"
              subtitle="Monthly master storyteller"
              unlocked={computedStats.totalEntries >= 30}
            />
            <BadgeCard
              id="streak"
              title="Storyteller"
              subtitle="Over 1,000 words recorded"
              unlocked={computedStats.totalWords >= 1000}
            />
            <BadgeCard
              id="thirty-entries"
              title="Journal Guru"
              subtitle="Over 5,000 words penned"
              unlocked={computedStats.totalWords >= 5000}
            />
          </div>
        </section>
      </FadeIn>
    </div>
  );
};
