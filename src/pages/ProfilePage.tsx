import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileApi } from '../api/profile';
import { UserProfile } from '../types/user';
import { Icon } from '../icons/Icon';
import { BRAND } from '../icons/icons';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { FadeIn } from '../components/common/FadeIn';
import { Modal } from '../components/common/Modal';
import { Toast, ToastProps } from '../components/common/Toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Profile Form State
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Preferences State
  const [reminderEnabled, setReminderEnabled] = useState(
    user?.preferences?.notifications_enabled ?? true
  );
  const [reminderTime, setReminderTime] = useState(
    user?.preferences?.reminder_time || '20:00'
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Export State
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      if (user.preferences) {
        setReminderEnabled(user.preferences.notifications_enabled);
        if (user.preferences.reminder_time) {
          setReminderTime(user.preferences.reminder_time);
        }
      }
    }
  }, [user]);

  // Load detailed profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileApi.getProfile();
        updateUser(data);
        setUsername(data.username);
        setEmail(data.email);
        if (data.preferences) {
          setReminderEnabled(data.preferences.notifications_enabled);
          if (data.preferences.reminder_time) {
            setReminderTime(data.preferences.reminder_time);
          }
        }
      } catch (err: any) {
        // Fallback silently if offline or token expired
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: 'error',
        message: 'Image size should be less than 5MB.',
      });
      return;
    }

    try {
      setAvatarUploading(true);
      const res = await profileApi.uploadAvatar(file);
      updateUser({ avatar_url: res.avatar_url });
      setToast({
        type: 'success',
        message: 'Profile picture updated successfully!',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to upload image',
      });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Delete Avatar
  const handleDeleteAvatar = async () => {
    try {
      setAvatarUploading(true);
      await profileApi.deleteAvatar();
      updateUser({ avatar_url: null });
      setToast({
        type: 'info',
        message: 'Profile picture removed.',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to remove avatar',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updated = await profileApi.updateProfile({ username, email });
      updateUser(updated);
      setToast({
        type: 'success',
        message: 'Profile information saved.',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      const res = await profileApi.updatePreferences({
        notifications_enabled: reminderEnabled,
        reminder_time: reminderTime,
      });
      updateUser({ preferences: res.preferences });
      setToast({
        type: 'success',
        message: 'Preferences saved.',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update preferences',
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setToast({
        type: 'error',
        message: 'New password must be at least 6 characters.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({
        type: 'error',
        message: 'New passwords do not match.',
      });
      return;
    }

    try {
      setChangingPassword(true);
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({
        type: 'success',
        message: 'Password changed successfully.',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to change password',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Export Data
  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await profileApi.exportData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `mydiary_backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setToast({
        type: 'success',
        message: 'Diary backup downloaded successfully!',
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to export diary data',
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setToast({
        type: 'error',
        message: 'Please type DELETE in capital letters to confirm.',
      });
      return;
    }

    try {
      setDeletingAccount(true);
      await profileApi.deleteAccount({
        password: deletePassword,
        confirmation: 'DELETE',
      });
      logout();
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete account',
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="dashboard-container">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <FadeIn delay={0}>
        <div className="dashboard-hero" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 className="hero-title">Account & Settings</h1>
            <p className="hero-date">Manage your profile, preferences, privacy, and backups.</p>
          </div>
          <div className="hero-icon-pill" aria-hidden="true">
            <Icon name="profile" size={22} color={BRAND.primary} />
          </div>
        </div>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Avatar & Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Avatar Card */}
          <FadeIn delay={80}>
            <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative', marginBottom: '1rem' }}>
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      margin: '0 auto',
                      border: '2px solid var(--border)',
                    }}
                  >
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user?.username}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {user?.email}
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  loading={avatarUploading}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  <Icon name="image" size={16} />
                  <span>{user?.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
                </Button>
                {user?.avatar_url && (
                  <Button
                    variant="ghost"
                    onClick={handleDeleteAvatar}
                    style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    <Icon name="delete" size={16} color="currentColor" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            </Card>
          </FadeIn>

          {/* Edit Profile Details */}
          <FadeIn delay={160}>
            <Card style={{ padding: '1.25rem' }}>
              <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                <Icon name="edit" size={20} color={BRAND.primary} aria-hidden="true" />
                <h3>Personal Information</h3>
              </div>

              <form onSubmit={handleSaveProfile} className="entry-form">
                <div className="form-group">
                  <label htmlFor="prof-username">Username</label>
                  <input
                    id="prof-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prof-email">Email Address</label>
                  <input
                    id="prof-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <Button type="submit" variant="primary" glow loading={savingProfile}>
                    <Icon name="saved" size={16} color="#ffffff" />
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </Card>
          </FadeIn>
        </div>

        {/* Right Column: Preferences, Security & Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Preferences & Daily Reminder */}
          <FadeIn delay={120}>
            <Card style={{ padding: '1.25rem' }}>
              <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                <Icon name="notifications" size={20} color={BRAND.primary} aria-hidden="true" />
                <h3>Journal Preferences</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Theme mode toggle row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Appearance Theme
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Currently using {theme === 'light' ? 'Light' : 'Dark'} mode
                    </p>
                  </div>
                  <Button variant="outline" onClick={toggleTheme} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    <Icon name={theme === 'light' ? 'darkTheme' : 'lightTheme'} size={16} />
                    <span>Switch to {theme === 'light' ? 'Dark' : 'Light'}</span>
                  </Button>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                {/* Daily Reminder Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Daily Reminder
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Receive daily notification prompts to write
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>

                {/* Reminder Time Picker */}
                {reminderEnabled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="reminder-time" style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      Reminder Time
                    </label>
                    <input
                      id="reminder-time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <Button variant="outline" onClick={handleSavePreferences} loading={savingPrefs}>
                    <Icon name="saved" size={16} />
                    <span>Save Preferences</span>
                  </Button>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Change Password Card */}
          <FadeIn delay={200}>
            <Card style={{ padding: '1.25rem' }}>
              <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                <Icon name="password" size={20} color={BRAND.primary} aria-hidden="true" />
                <h3>Change Password</h3>
              </div>

              <form onSubmit={handleChangePassword} className="entry-form">
                <div className="form-group">
                  <label htmlFor="cur-pass">Current Password</label>
                  <input
                    id="cur-pass"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-pass">New Password</label>
                  <input
                    id="new-pass"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="conf-pass">Confirm New Password</label>
                  <input
                    id="conf-pass"
                    type="password"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Button type="submit" variant="primary" glow loading={changingPassword}>
                    <Icon name="lock" size={16} color="#ffffff" />
                    <span>Update Password</span>
                  </Button>
                </div>
              </form>
            </Card>
          </FadeIn>

          {/* Data Export & Danger Zone */}
          <FadeIn delay={280}>
            <Card style={{ padding: '1.25rem' }}>
              <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                <Icon name="privacy" size={20} color={BRAND.primary} aria-hidden="true" />
                <h3>Data & Account Safety</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Export Data */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Backup & Export
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Download all your diary memories as JSON
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData} loading={exporting}>
                    <Icon name="share" size={16} />
                    <span>Export Data</span>
                  </Button>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                {/* Delete Account */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--danger)' }}>
                      Delete Account
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Permanently wipe all journal entries and account data
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger-light)' }}
                  >
                    <Icon name="delete" size={16} color="currentColor" />
                    <span>Delete Account</span>
                  </Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem',
          }}
        >
          <div
            className="modal-content-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius)',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem' }}>
              Permanently Delete Account?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This action <strong>cannot be undone</strong>. All your memories, statistics, and preferences will be permanently wiped from the database.
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Confirm your password</label>
              <input
                type="password"
                placeholder="Account password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem' }}>
                Type <strong>DELETE</strong> below:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteAccount}
                loading={deletingAccount}
                style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
