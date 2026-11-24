import React, { useState, useEffect, useMemo } from 'react';
import { diaryApi } from '../api/diary';
import { DiaryEntry } from '../types/diary';
import { Icon } from '../icons/Icon';
import { BRAND, MOODS, MoodKey, MOOD_STYLE } from '../icons/icons';
import { MoodBadge } from '../components/common/MoodBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FadeIn } from '../components/common/FadeIn';
import { Stagger } from '../components/common/Stagger';
import { Skeleton } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';
import { Toast, ToastProps } from '../components/common/Toast';

export const DiaryPage: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states for Create / Edit
  const todayStr = new Date().toISOString().split('T')[0];
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(todayStr);
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<MoodKey>('grateful');
  const [submitting, setSubmitting] = useState(false);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await diaryApi.getEntries();
      setEntries(data);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to load journal entries',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Open Create Modal
  const openCreateModal = () => {
    setFormTitle('');
    setFormDate(todayStr);
    setFormContent('');
    setFormMood('grateful');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const openEditModal = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormDate(entry.entry_date);

    // Extract mood if present
    const moodMatch = entry.content.match(/^\[Mood:\s*(\w+)\]/);
    if (moodMatch) {
      const parsedMood = moodMatch[1].toLowerCase() as MoodKey;
      if (parsedMood in MOODS) {
        setFormMood(parsedMood);
      }
      setFormContent(entry.content.replace(/^\[Mood:\s*\w+\]\n?/, ''));
    } else {
      setFormMood('grateful');
      setFormContent(entry.content);
    }
  };

  // Submit Create Entry
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formContent) return;

    try {
      setSubmitting(true);
      const formattedContent = `[Mood: ${MOODS[formMood].label}]\n${formContent}`;
      await diaryApi.createEntry({
        title: formTitle,
        content: formattedContent,
        entry_date: formDate,
      });

      setShowCreateModal(false);
      setToast({
        type: 'success',
        message: 'Your memory has been safely created.',
      });
      await loadEntries();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to save entry',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Entry
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !formTitle || !formDate || !formContent) return;

    try {
      setSubmitting(true);
      const formattedContent = `[Mood: ${MOODS[formMood].label}]\n${formContent}`;
      await diaryApi.updateEntry(editingEntry.id, {
        title: formTitle,
        content: formattedContent,
        entry_date: formDate,
      });

      setEditingEntry(null);
      if (viewingEntry && viewingEntry.id === editingEntry.id) {
        setViewingEntry({
          ...viewingEntry,
          title: formTitle,
          content: formattedContent,
          entry_date: formDate,
        });
      }

      setToast({
        type: 'success',
        message: 'Memory updated successfully.',
      });
      await loadEntries();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update entry',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await diaryApi.deleteEntry(deleteId);
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
      if (viewingEntry?.id === deleteId) {
        setViewingEntry(null);
      }
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

  // Filter and Sort entries
  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      );
    }

    // Mood filter
    if (selectedMoodFilter !== 'all') {
      result = result.filter((e) => {
        const moodPattern = new RegExp(`\\[Mood:\\s*${selectedMoodFilter}\\]`, 'i');
        return moodPattern.test(e.content);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime();
      }
      if (sortBy === 'alpha') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [entries, searchQuery, selectedMoodFilter, sortBy]);

  // Helper to extract mood from content
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

  return (
    <div className="dashboard-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header & Write Button */}
      <FadeIn delay={0}>
        <div className="dashboard-hero" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="hero-title">My Journal</h1>
            <p className="hero-date">Explore, reflect, and revisit all your captured memories.</p>
          </div>
          <Button variant="primary" glow onClick={openCreateModal}>
            <Icon name="add" size={18} color="#ffffff" aria-hidden="true" />
            <span>Write New Memory</span>
          </Button>
        </div>
      </FadeIn>

      {/* Controls Bar: Search, Mood Filter, Sort */}
      <FadeIn delay={80}>
        <div
          className="diary-controls-card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Top row: Search input & Sort */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="search" size={18} aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search by keywords or feelings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: searchQuery ? '2.5rem' : '1rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Clear search"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="sort" size={18} color="var(--text-muted)" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Bottom row: Mood Pills Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Filter by Mood:
            </span>
            <button
              onClick={() => setSelectedMoodFilter('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedMoodFilter === 'all' ? 'var(--primary)' : 'var(--border)',
                backgroundColor:
                  selectedMoodFilter === 'all' ? 'var(--primary-light)' : 'transparent',
                color: selectedMoodFilter === 'all' ? 'var(--primary)' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 150ms var(--ease-out)',
              }}
            >
              All ({entries.length})
            </button>
            {(Object.keys(MOODS) as MoodKey[]).map((key) => {
              const mood = MOODS[key];
              const count = entries.filter((e) =>
                new RegExp(`\\[Mood:\\s*${key}\\]`, 'i').test(e.content)
              ).length;
              const isSelected = selectedMoodFilter === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedMoodFilter(isSelected ? 'all' : key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: isSelected ? mood.color : 'var(--border)',
                    backgroundColor: isSelected ? `${mood.color}22` : 'transparent',
                    color: isSelected ? mood.color : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 150ms var(--ease-out)',
                  }}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Entries List */}
      <section>
        {loading ? (
          <div className="entries-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
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
                  <Skeleton width={110} height={18} />
                  <Skeleton width={24} height={24} rounded="sm" />
                </div>
                <Skeleton width="75%" height={24} />
                <Skeleton width="100%" height={16} />
                <Skeleton width="90%" height={16} />
              </div>
            ))}
          </div>
        ) : filteredAndSortedEntries.length === 0 ? (
          <div className="empty-state">
            <EmptyState
              title={
                searchQuery || selectedMoodFilter !== 'all'
                  ? 'No Matching Memories'
                  : 'No Journal Entries Yet'
              }
              description={
                searchQuery || selectedMoodFilter !== 'all'
                  ? 'Try adjusting your search terms or clearing your mood filter.'
                  : 'Start your writing journey today by recording your first diary memory!'
              }
            />
            {!searchQuery && selectedMoodFilter === 'all' && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <Button variant="primary" glow onClick={openCreateModal}>
                  <Icon name="add" size={18} color="#ffffff" aria-hidden="true" />
                  <span>Write Your First Entry</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Stagger
            delayStep={60}
            baseDelay={0}
            maxChildren={12}
            reveal={true}
            className="entries-grid"
          >
            {filteredAndSortedEntries.map((entry) => {
              const entryMood = extractMood(entry.content);
              const body = cleanContent(entry.content);

              return (
                <Card
                  key={entry.id}
                  as="article"
                  className="entry-card"
                  interactive
                  onClick={() => setViewingEntry(entry)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="entry-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {entryMood && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: `${MOODS[entryMood].color}18`,
                            color: MOODS[entryMood].color,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{MOODS[entryMood].emoji}</span>
                          <span>{MOODS[entryMood].label}</span>
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEditModal(entry)}
                        className="btn-icon-danger"
                        style={{ color: 'var(--text-muted)' }}
                        title="Edit entry"
                        aria-label={`Edit entry: ${entry.title}`}
                      >
                        <Icon name="edit" size={17} color="currentColor" />
                      </button>
                      <button
                        onClick={() => setDeleteId(entry.id)}
                        className="btn-icon-danger"
                        title="Delete entry"
                        aria-label={`Delete entry: ${entry.title}`}
                      >
                        <Icon name="delete" size={17} color="currentColor" />
                      </button>
                    </div>
                  </div>

                  <h3 className="entry-title">{entry.title}</h3>
                  <p
                    className="entry-content"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {body}
                  </p>
                </Card>
              );
            })}
          </Stagger>
        )}
      </section>

      {/* CREATE MODAL */}
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
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lift)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Write New Memory
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="entry-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="create-title">Title</label>
                  <input
                    id="create-title"
                    type="text"
                    placeholder="Give your memory a title..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="create-date">Date</label>
                  <input
                    id="create-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>How are you feeling?</label>
                <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {(Object.keys(MOODS) as MoodKey[]).map((key) => (
                    <MoodBadge
                      key={key}
                      moodKey={key}
                      selected={formMood === key}
                      size={36}
                      showLabel={true}
                      onClick={() => setFormMood(key)}
                      styleMode={MOOD_STYLE}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="create-content">Thoughts & Reflections</label>
                <textarea
                  id="create-content"
                  rows={6}
                  placeholder="What happened today? How did it make you feel? Write freely..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" glow loading={submitting}>
                  <Icon name="saved" size={18} color="#ffffff" />
                  <span>Save Memory</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingEntry && (
        <div
          className="modal-backdrop"
          onClick={() => setEditingEntry(null)}
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
              maxWidth: '600px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lift)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Edit Memory
              </h2>
              <button
                onClick={() => setEditingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="entry-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label htmlFor="edit-title">Title</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label htmlFor="edit-date">Date</label>
                  <input
                    id="edit-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mood</label>
                <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {(Object.keys(MOODS) as MoodKey[]).map((key) => (
                    <MoodBadge
                      key={key}
                      moodKey={key}
                      selected={formMood === key}
                      size={36}
                      showLabel={true}
                      onClick={() => setFormMood(key)}
                      styleMode={MOOD_STYLE}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-content">Content</label>
                <textarea
                  id="edit-content"
                  rows={6}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <Button type="button" variant="ghost" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" glow loading={submitting}>
                  <Icon name="saved" size={18} color="#ffffff" />
                  <span>Update Memory</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ENTRY MODAL (Reading Mode) */}
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
              maxWidth: '680px',
              width: '100%',
              padding: '2.25rem',
              boxShadow: 'var(--shadow-lift)',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="entry-date" style={{ fontSize: '0.9rem' }}>
                    <Icon name="calendar" size={15} />
                    <span>
                      {new Date(viewingEntry.entry_date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                  {extractMood(viewingEntry.content) && (
                    <span
                      style={{
                        fontSize: '0.8rem',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        backgroundColor: `${
                          MOODS[extractMood(viewingEntry.content)!].color
                        }22`,
                        color: MOODS[extractMood(viewingEntry.content)!].color,
                        fontWeight: 600,
                      }}
                    >
                      {MOODS[extractMood(viewingEntry.content)!].emoji}{' '}
                      {MOODS[extractMood(viewingEntry.content)!].label}
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {viewingEntry.title}
                </h1>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                marginBottom: '2rem',
                fontSize: '1.05rem',
                lineHeight: 1.7,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid var(--border)',
                paddingTop: '1.25rem',
              }}
            >
              {cleanContent(viewingEntry.content)}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
              }}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteId(viewingEntry.id);
                }}
                style={{ color: 'var(--danger)' }}
              >
                <Icon name="delete" size={18} color="currentColor" />
                <span>Delete</span>
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    const e = viewingEntry;
                    setViewingEntry(null);
                    openEditModal(e);
                  }}
                >
                  <Icon name="edit" size={18} />
                  <span>Edit</span>
                </Button>
                <Button variant="primary" onClick={() => setViewingEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
