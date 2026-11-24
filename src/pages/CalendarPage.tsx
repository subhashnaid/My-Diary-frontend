import React, { useState, useEffect, useMemo } from 'react';
import { diaryApi } from '../api/diary';
import { DiaryEntry } from '../types/diary';
import { Icon } from '../icons/Icon';
import { BRAND, MOODS, MoodKey, MOOD_STYLE } from '../icons/icons';
import { MoodBadge } from '../components/common/MoodBadge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FadeIn } from '../components/common/FadeIn';
import { Modal } from '../components/common/Modal';
import { Toast, ToastProps } from '../components/common/Toast';
import { extractTimeFromText, scheduleWebReminder, formatTime } from '../services/notifications';

export const CalendarPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Calendar Date State: current view year & month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Selected date (format: YYYY-MM-DD)
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Create Entry Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<MoodKey>('happy');
  const [submitting, setSubmitting] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState<number>(30); // 30 mins before

  // Smart Event Time Detection
  const detectedEventTime = useMemo(
    () => extractTimeFromText(formTitle + ' ' + formContent),
    [formTitle, formContent]
  );

  const calculatedNotificationTime = useMemo(() => {
    if (!detectedEventTime) return null;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day, detectedEventTime.hours, detectedEventTime.minutes, 0);
    const reminderDate = new Date(eventDate.getTime() - reminderOffset * 60 * 1000);
    return formatTime(reminderDate);
  }, [detectedEventTime, selectedDate, reminderOffset]);

  // View / Delete state
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  // Map entries by date string for quick lookup
  const entriesByDate = useMemo(() => {
    const map: Record<string, DiaryEntry[]> = {};
    entries.forEach((e) => {
      // Normalize to YYYY-MM-DD
      const dateKey = e.entry_date.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(e);
    });
    return map;
  }, [entries]);

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Generate days in month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d);
      const str = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const str = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = 42 - days.length; // 6 rows of 7
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d);
      const str = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayEntries = useMemo(() => {
    return entriesByDate[selectedDate] || [];
  }, [entriesByDate, selectedDate]);

  const extractMood = (content: string): MoodKey | null => {
    const match = content.match(/^\[Mood:\s*(\w+)\]/);
    if (match) {
      const key = match[1].toLowerCase() as MoodKey;
      if (key in MOODS) return key;
    }
    return null;
  };

  const cleanContent = (content: string): string => {
    return content.replace(/^\[Mood:\s*\w+\]\n?/, '');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) return;

    try {
      setSubmitting(true);
      const formattedContent = `[Mood: ${MOODS[formMood].label}]\n${formContent}`;
      await diaryApi.createEntry({
        title: formTitle,
        content: formattedContent,
        entry_date: selectedDate,
      });

      let reminderMessage = 'Memory saved for this day!';
      if (reminderEnabled && detectedEventTime) {
        const scheduled = await scheduleWebReminder({
          title: formTitle,
          entryDate: selectedDate,
          eventTime: detectedEventTime,
          offsetMinutes: reminderOffset,
        });
        if (scheduled) {
          reminderMessage = `Memory saved! 🔔 Reminder notification scheduled for ${formatTime(scheduled.reminderDate)} (${reminderOffset}m before event).`;
        }
      }

      setShowCreateModal(false);
      setFormTitle('');
      setFormContent('');
      setToast({
        type: 'success',
        message: reminderMessage,
      });
      await loadEntries();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to create memory',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await diaryApi.deleteEntry(deleteId);
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
      if (viewingEntry?.id === deleteId) setViewingEntry(null);
      setToast({
        type: 'info',
        message: 'Memory deleted.',
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

  return (
    <div className="dashboard-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <FadeIn delay={0}>
        <div className="dashboard-hero" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="hero-title">Memory Calendar</h1>
            <p className="hero-date">Look back at your journey day by day.</p>
          </div>
          <Button variant="outline" onClick={jumpToToday}>
            <Icon name="calendar" size={16} />
            <span>Go to Today</span>
          </Button>
        </div>
      </FadeIn>

      <div className="calendar-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(280px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Calendar View Card */}
        <Card style={{ padding: '1.15rem' }}>
          {/* Calendar Header with Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={prevMonth}
                className="btn-theme-toggle"
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '8px' }}
                title="Previous month"
              >
                <Icon name="back" size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="btn-theme-toggle"
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', borderRadius: '8px' }}
                title="Next month"
              >
                <Icon name="next" size={18} />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((day, idx) => {
              const dayEntries = entriesByDate[day.dateStr] || [];
              const isSelected = selectedDate === day.dateStr;
              const hasEntries = dayEntries.length > 0;

              // Dominant mood
              const dominantMood = hasEntries ? extractMood(dayEntries[0].content) : null;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '2px solid var(--primary)'
                      : day.isToday
                      ? '1px dashed var(--primary)'
                      : '1px solid transparent',
                    backgroundColor: isSelected
                      ? 'var(--primary-light)'
                      : day.isCurrentMonth
                      ? 'var(--surface-hover)'
                      : 'transparent',
                    color: !day.isCurrentMonth
                      ? 'var(--text-muted)'
                      : isSelected
                      ? 'var(--primary)'
                      : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 120ms ease',
                    opacity: day.isCurrentMonth ? 1 : 0.45,
                    padding: '2px',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: isSelected || day.isToday ? 700 : 500 }}>
                    {day.dayNum}
                  </span>

                  {/* Mood Dots / Indicators */}
                  {hasEntries && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '2px', alignItems: 'center' }}>
                      {dominantMood ? (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: MOODS[dominantMood].color,
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                          }}
                        />
                      )}
                      {dayEntries.length > 1 && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          +{dayEntries.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Details Panel */}
        <div>
          <Card style={{ padding: '1.15rem', minHeight: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Selected Date
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setFormTitle('');
                  setFormContent('');
                  setFormMood('happy');
                  setShowCreateModal(true);
                }}
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <Icon name="add" size={16} color="#ffffff" />
                <span>Add Memory</span>
              </Button>
            </div>

            {/* List of entries on this date */}
            {selectedDayEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Icon name="calendar" size={36} color="var(--border)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>
                  No memories on this date
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Click "Add Memory" above to write down what happened on this day.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedDayEntries.map((entry) => {
                  const entryMood = extractMood(entry.content);
                  const entryTime = extractTimeFromText(entry.title + ' ' + entry.content);
                  const body = cleanContent(entry.content);

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setViewingEntry(entry)}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {entry.title}
                        </h4>
                        {entryMood && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: `${MOODS[entryMood].color}22`,
                              color: MOODS[entryMood].color,
                              fontWeight: 600,
                            }}
                          >
                            {MOODS[entryMood].emoji} {MOODS[entryMood].label}
                          </span>
                        )}
                      </div>

                      {entryTime && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            marginBottom: '6px',
                          }}
                        >
                          <Icon name="reminder" size={13} color="currentColor" />
                          <span>Event at {entryTime.displayTime}</span>
                        </div>
                      )}
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* CREATE ENTRY MODAL */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div
            className="modal-content-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius)',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                New Memory for {selectedDate}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="entry-form">
              <div className="form-group">
                <label htmlFor="cal-title">Title</label>
                <input
                  id="cal-title"
                  type="text"
                  placeholder='e.g. "I have interview at 2 pm"'
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Smart Reminder Detection Banner */}
              {detectedEventTime && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--primary)',
                    backgroundColor: 'var(--surface-subtle)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="reminder" size={18} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          Event detected: {detectedEventTime.displayTime}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Notification scheduled for {calculatedNotificationTime} ({reminderOffset}m before)
                        </div>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enable</span>
                    </label>
                  </div>

                  {reminderEnabled && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                      {[15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setReminderOffset(mins)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: reminderOffset === mins ? 'var(--primary)' : 'var(--border)',
                            backgroundColor: reminderOffset === mins ? 'var(--primary)' : 'var(--surface)',
                            color: reminderOffset === mins ? '#ffffff' : 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {mins}m before
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Mood</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {(Object.keys(MOODS) as MoodKey[]).map((key) => (
                    <MoodBadge
                      key={key}
                      moodKey={key}
                      selected={formMood === key}
                      size={34}
                      showLabel={true}
                      onClick={() => setFormMood(key)}
                      styleMode={MOOD_STYLE}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cal-content">Reflection</label>
                <textarea
                  id="cal-content"
                  rows={5}
                  placeholder="Write your memory..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" glow loading={submitting}>
                  <Icon name="saved" size={16} color="#ffffff" />
                  <span>Save Memory</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ENTRY MODAL */}
      {viewingEntry && (
        <div
          className="modal-backdrop"
          onClick={() => setViewingEntry(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '1rem',
          }}
        >
          <div
            className="modal-content-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius)',
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="entry-date" style={{ fontSize: '0.85rem' }}>
                  <Icon name="calendar" size={14} />
                  <span>{viewingEntry.entry_date}</span>
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                  {viewingEntry.title}
                </h2>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div
              style={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                margin: '1.5rem 0',
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
              }}
            >
              {cleanContent(viewingEntry.content)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <Button
                variant="ghost"
                onClick={() => setDeleteId(viewingEntry.id)}
                style={{ color: 'var(--danger)' }}
              >
                <Icon name="delete" size={16} color="currentColor" />
                <span>Delete</span>
              </Button>
              <Button variant="primary" onClick={() => setViewingEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        title="Delete Memory"
        description="Are you sure you want to remove this entry?"
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
