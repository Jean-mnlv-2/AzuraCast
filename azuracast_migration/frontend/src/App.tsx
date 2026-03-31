import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Features
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import StationList from './features/stations/components/StationList';
import StationProfile from './features/stations/components/StationProfile';
import StationMedia from './features/stations/components/StationMedia';
import StationPlaylists from './features/stations/components/StationPlaylists';
import PlaylistMedia from './features/stations/components/PlaylistMedia';
import StationStreamers from './features/stations/components/StationStreamers';
import StationWebhooks from './features/stations/components/StationWebhooks';
import StationAnalytics from './features/stations/components/StationAnalytics';
import StationMounts from './features/stations/components/StationMounts';
import StationRemotes from './features/stations/components/StationRemotes';
import StationHlsStreams from './features/stations/components/StationHlsStreams';
import StationPodcasts from './features/stations/components/StationPodcasts';
import PodcastDetails from './features/stations/components/PodcastDetails';
import WebDj from './features/stations/components/WebDj';
import StationSettings from './features/stations/components/StationSettings';
import SftpUsers from './features/stations/components/SftpUsers';
import UserList from './features/admin/components/UserList';
import AdminStationList from './features/admin/components/AdminStationList';
import AdminDashboard from './features/admin/components/AdminDashboard';
import GlobalSettings from './features/admin/settings/GlobalSettings';
import PublicPlayer from './features/public/components/PublicPlayer';
import Documentation from './features/admin/components/Documentation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-grow text-danger" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-grow text-danger" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.is_superuser) return <Navigate to="/" />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

const App: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public/:station_short_name" element={<PublicPlayer />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<PrivateRoute><StationList /></PrivateRoute>} />
          <Route path="/stations" element={<PrivateRoute><StationList /></PrivateRoute>} />
          
          {/* Station Specific Routes */}
          <Route path="/station/:station_short_name" element={<PrivateRoute><StationProfile /></PrivateRoute>} />
          <Route path="/station/:station_short_name/media" element={<PrivateRoute><StationMedia /></PrivateRoute>} />
          <Route path="/station/:station_short_name/playlists" element={<PrivateRoute><StationPlaylists /></PrivateRoute>} />
          <Route path="/station/:station_short_name/playlists/:playlist_id/media" element={<PrivateRoute><PlaylistMedia /></PrivateRoute>} />
          <Route path="/station/:station_short_name/streamers" element={<PrivateRoute><StationStreamers /></PrivateRoute>} />
          <Route path="/station/:station_short_name/webhooks" element={<PrivateRoute><StationWebhooks /></PrivateRoute>} />
          <Route path="/station/:station_short_name/mounts" element={<PrivateRoute><StationMounts /></PrivateRoute>} />
          <Route path="/station/:station_short_name/remotes" element={<PrivateRoute><StationRemotes /></PrivateRoute>} />
          <Route path="/station/:station_short_name/hls" element={<PrivateRoute><StationHlsStreams /></PrivateRoute>} />
          <Route path="/station/:station_short_name/settings" element={<PrivateRoute><StationSettings /></PrivateRoute>} />
          <Route path="/station/:station_short_name/sftp" element={<PrivateRoute><SftpUsers /></PrivateRoute>} />
          <Route path="/station/:station_short_name/analytics" element={<PrivateRoute><StationAnalytics /></PrivateRoute>} />
          <Route path="/station/:station_short_name/podcasts" element={<PrivateRoute><StationPodcasts /></PrivateRoute>} />
          <Route path="/station/:station_short_name/podcasts/:podcast_id" element={<PrivateRoute><PodcastDetails /></PrivateRoute>} />
          <Route path="/station/:station_short_name/web-dj" element={<PrivateRoute><WebDj /></PrivateRoute>} />
          
          {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserList /></AdminRoute>} />
            <Route path="/admin/stations" element={<AdminRoute><AdminStationList /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><GlobalSettings /></AdminRoute>} />
          <Route path="/admin/docs" element={<PrivateRoute><Documentation /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
