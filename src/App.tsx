import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiaryPage } from './pages/DiaryPage';
import { CalendarPage } from './pages/CalendarPage';
import { StatsPage } from './pages/StatsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  // Ensure laptop view by cleaning any mobile simulator attributes
  useEffect(() => {
    document.documentElement.removeAttribute('data-device-mode');
    localStorage.removeItem('mydiary_device_mode');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.documentElement.setAttribute('data-tab-hidden', 'true');
      } else {
        document.documentElement.removeAttribute('data-tab-hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Application Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/diary"
                  element={
                    <ProtectedRoute>
                      <DiaryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <ProtectedRoute>
                      <StatsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Redirects & Fallback */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
