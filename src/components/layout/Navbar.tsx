import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../../icons/Icon';
import { TAB_ICONS, BRAND } from '../../icons/icons';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isHome = location.pathname === '/dashboard' || location.pathname === '/';
  const isDiary = location.pathname.startsWith('/diary');
  const isCalendar = location.pathname.startsWith('/calendar');
  const isStats = location.pathname.startsWith('/stats');
  const isProfile = location.pathname.startsWith('/profile');

  const navItems = [
    {
      to: '/dashboard',
      label: 'Home',
      iconActive: TAB_ICONS.home[1],
      iconIdle: TAB_ICONS.home[0],
      active: isHome,
    },
    {
      to: '/diary',
      label: 'Journal',
      iconActive: TAB_ICONS.diary[1],
      iconIdle: TAB_ICONS.diary[0],
      active: isDiary,
    },
    {
      to: '/calendar',
      label: 'Calendar',
      iconActive: TAB_ICONS.calendar[1],
      iconIdle: TAB_ICONS.calendar[0],
      active: isCalendar,
    },
    {
      to: '/stats',
      label: 'Insights',
      iconActive: TAB_ICONS.stats[1],
      iconIdle: TAB_ICONS.stats[0],
      active: isStats,
    },
    {
      to: '/profile',
      label: 'Profile',
      iconActive: TAB_ICONS.profile[1],
      iconIdle: TAB_ICONS.profile[0],
      active: isProfile,
    },
  ];

  return (
    <>
      {/* Top Desktop/Tablet Navbar */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
            <div className="brand-icon-wrapper" aria-hidden="true">
              <span className="pulse-ring-beacon" />
              <Icon name="diary" size={24} color={BRAND.primary} className="brand-icon-animated" />
            </div>
            <span className="brand-title">MyDiary</span>
          </Link>

          {/* Center Navigation Tabs (Desktop / Tablet) */}
          {user && (
            <div className="navbar-nav-tabs desktop-nav-tabs" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-pill ${item.active ? 'active' : 'idle'}`}
                  title={item.label}
                  aria-label={item.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    width: 'auto',
                    height: '36px',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <Icon
                    name={item.active ? item.iconActive : item.iconIdle}
                    size={19}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions: Theme Toggle, Profile Avatar pill, Logout */}
          <div className="navbar-actions">
            <button
              onClick={toggleTheme}
              className="btn-theme-toggle pressable"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              <Icon
                name={theme === 'light' ? 'darkTheme' : 'lightTheme'}
                size={20}
                color="currentColor"
                aria-hidden="true"
              />
            </button>

            {user && (
              <>
                <Link
                  to="/profile"
                  className="user-greeting"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: isProfile ? 'var(--primary-light)' : 'transparent',
                    color: isProfile ? 'var(--primary)' : 'var(--text-main)',
                  }}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span style={{ fontWeight: 600 }}>{user.username}</span>
                </Link>

                <button
                  onClick={logout}
                  className="btn-logout pressable"
                  title="Log out"
                  aria-label="Log out of MyDiary"
                >
                  <Icon name="logout" size={18} color="currentColor" aria-hidden="true" />
                  <span className="logout-text">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Mobile Tab Bar (Visible on mobile screens or mobile simulation mode) */}
      {user && (
        <nav
          className="mobile-bottom-nav"
          role="navigation"
          aria-label="Mobile Navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: item.active ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: item.active ? 700 : 500,
                padding: '4px 8px',
                borderRadius: '8px',
              }}
            >
              <Icon
                name={item.active ? item.iconActive : item.iconIdle}
                size={22}
                color={item.active ? 'var(--primary)' : 'currentColor'}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
};
