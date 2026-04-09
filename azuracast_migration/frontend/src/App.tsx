import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Features
const Login = lazy(() => import('./features/auth/Login'));
const Register = lazy(() => import('./features/auth/Register'));

// Station Features
const StationList = lazy(() => import('./features/stations/components/StationList'));
const StationProfile = lazy(() => import('./features/stations/components/StationProfile'));
const StationMedia = lazy(() => import('./features/stations/components/StationMedia'));
const TitleManager = lazy(() => import('./features/stations/components/TitleManager'));
const StationPlaylists = lazy(() => import('./features/stations/components/StationPlaylists'));
const PlaylistMedia = lazy(() => import('./features/stations/components/PlaylistMedia'));
const StationStreamers = lazy(() => import('./features/stations/components/StationStreamers'));
const StationWebhooks = lazy(() => import('./features/stations/components/StationWebhooks'));
const StationAnalytics = lazy(() => import('./features/stations/components/StationAnalytics'));
const StationMounts = lazy(() => import('./features/stations/components/StationMounts'));
const StationRemotes = lazy(() => import('./features/stations/components/StationRemotes'));
const StationHlsStreams = lazy(() => import('./features/stations/components/StationHlsStreams'));
const StationPodcasts = lazy(() => import('./features/stations/components/StationPodcasts'));
const PodcastDetails = lazy(() => import('./features/stations/components/PodcastDetails'));
const WebDj = lazy(() => import('./features/stations/components/WebDj'));
const StationSettings = lazy(() => import('./features/stations/components/StationSettings'));
const SftpUsers = lazy(() => import('./features/stations/components/SftpUsers'));

// Admin Features
const UserList = lazy(() => import('./features/admin/components/UserList'));
const AdminStationList = lazy(() => import('./features/admin/components/AdminStationList'));
const AdminDashboard = lazy(() => import('./features/admin/components/AdminDashboard'));
const FleetManagement = lazy(() => import('./features/admin/components/FleetManagement'));
const BillingDashboard = lazy(() => import('./features/admin/components/BillingDashboard'));
const AuditLogs = lazy(() => import('./features/admin/components/AuditLogs'));
const GlobalCampaigns = lazy(() => import('./features/admin/components/GlobalCampaigns'));
const GlobalLibrary = lazy(() => import('./features/admin/components/GlobalLibrary'));
const GlobalSettings = lazy(() => import('./features/admin/settings/GlobalSettings'));
const Documentation = lazy(() => import('./features/admin/components/Documentation'));

// Public Features
const PublicPlayer = lazy(() => import('./features/public/components/PublicPlayer'));

const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div className="spinner-border text-danger" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

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

  if (isLoading) {
    return <LoadingFallback />;
  }

  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!(user?.is_superuser || user?.is_staff)) return <Navigate to="/" />;

  return <DashboardLayout>{children}</DashboardLayout>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingFallback />;
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
        <Suspense fallback={<LoadingFallback />}>
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
            <Route path="/station/:station_short_name/titles" element={<PrivateRoute><TitleManager /></PrivateRoute>} />
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
            <Route path="/admin/fleet" element={<SuperAdminRoute><FleetManagement /></SuperAdminRoute>} />
            <Route path="/admin/billing" element={<SuperAdminRoute><BillingDashboard /></SuperAdminRoute>} />
            <Route path="/admin/ads" element={<SuperAdminRoute><GlobalCampaigns /></SuperAdminRoute>} />
            <Route path="/admin/library" element={<SuperAdminRoute><GlobalLibrary /></SuperAdminRoute>} />
            <Route path="/admin/audit" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />
            <Route path="/admin/users" element={<SuperAdminRoute><UserList /></SuperAdminRoute>} />
            <Route path="/admin/stations" element={<AdminRoute><AdminStationList /></AdminRoute>} />
            <Route path="/admin/settings" element={<SuperAdminRoute><GlobalSettings /></SuperAdminRoute>} />
            <Route path="/admin/docs" element={<PrivateRoute><Documentation /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
