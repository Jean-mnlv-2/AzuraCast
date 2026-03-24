import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Radio, 
  Users, 
  Settings, 
  Database, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  Music,
  Calendar,
  Share2,
  BarChart3,
  Sun,
  Moon,
  Languages,
  ChevronLeft,
  ListMusic,
  UserCheck,
  Zap,
  HardDrive,
  Globe,
  Activity,
  Rss
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  isBack?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const params = useParams<{ station_short_name?: string }>();
  const { logout, user } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const station_short_name = params.station_short_name;
  const isStationView = !!station_short_name;

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  const globalNavigation: NavigationItem[] = [
    { name: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('nav.stations'), href: '/stations', icon: Radio },
    { name: t('nav.users'), href: '/admin/users', icon: Users, adminOnly: true },
    { name: t('nav.settings'), href: '/admin/settings', icon: Settings, adminOnly: true },
  ];

  const stationNavigation: NavigationItem[] = [
    { name: t('nav.back_to_dashboard'), href: '/', icon: ChevronLeft, isBack: true },
    { name: t('nav.profile'), href: `/station/${station_short_name}`, icon: LayoutDashboard },
    { name: t('nav.media'), href: `/station/${station_short_name}/media`, icon: Music },
    { name: t('nav.playlists'), href: `/station/${station_short_name}/playlists`, icon: ListMusic },
    { name: t('nav.streamers'), href: `/station/${station_short_name}/streamers`, icon: UserCheck },
    { name: t('nav.webhooks'), href: `/station/${station_short_name}/webhooks`, icon: Share2 },
    { name: t('nav.mounts'), href: `/station/${station_short_name}/mounts`, icon: Zap },
    { name: t('nav.remotes'), href: `/station/${station_short_name}/remotes`, icon: Globe },
    { name: t('nav.hls_streams'), href: `/station/${station_short_name}/hls`, icon: Activity },
    { name: t('nav.sftp_users'), href: `/station/${station_short_name}/sftp`, icon: HardDrive },
    { name: t('nav.analytics'), href: `/station/${station_short_name}/analytics`, icon: BarChart3 },
    { name: 'Podcasts', href: `/station/${station_short_name}/podcasts`, icon: Rss },
    { name: t('stations.configuration'), href: `/station/${station_short_name}/settings`, icon: Settings },
  ];

  const navigation = isStationView ? stationNavigation : globalNavigation;
  const filteredNavigation = navigation.filter(item => !item.adminOnly || user?.is_superuser);

  return (
    <div className="min-vh-100 d-flex dashboard-wrapper">
      {/* Sidebar Desktop */}
      <aside className="sidebar d-none d-lg-flex flex-column" style={{ width: '280px', minWidth: '280px' }}>
        <div className="p-4 mb-3 d-flex align-items-center gap-3">
          <div className="bg-danger rounded-3 p-2 shadow-sm">
            <Radio className="text-white" size={24} />
          </div>
          <span className="fw-800 fs-4 tracking-tight text-white">BantuWave</span>
        </div>

        <nav className="flex-grow-1 overflow-y-auto py-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-link ${location.pathname === item.href ? 'active' : ''} ${item.isBack ? 'nav-back' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-top border-white border-opacity-10">
          <div className="d-flex align-items-center gap-3 mb-4 px-2">
            <div className="bg-primary rounded-circle p-2 text-white fw-bold shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white fw-600 mb-0 text-truncate small">{user?.name || 'Utilisateur'}</p>
              <p className="text-white-50 mb-0 smaller text-truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="btn btn-link text-white-50 text-decoration-none d-flex align-items-center gap-2 p-2 w-100 hover-bg-sidebar-hover rounded-3 transition-all small fw-600"
          >
            <LogOut size={18} /> {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column min-width-0">
        {/* Navbar */}
        <header className="main-header-bw border-bottom sticky-top z-index-1020" style={{ height: '70px' }}>
          <div className="h-100 px-4 d-flex align-items-center justify-content-between">
            <button 
              className="btn btn-light d-lg-none"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="d-none d-lg-block">
              <h5 className="mb-0 fw-700 text-main">
                {isStationView ? station_short_name : t('nav.dashboard')}
              </h5>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button 
                variant="light" 
                size="sm" 
                onClick={toggleDarkMode}
                className="rounded-circle p-2 border-0 shadow-none bg-transparent hover-bg-light"
              >
                {isDarkMode ? <Sun size={20} className="text-warning" /> : <Moon size={20} className="text-muted" />}
              </Button>
              
              <Button 
                variant="light" 
                size="sm" 
                onClick={toggleLanguage}
                className="rounded-circle p-2 border-0 shadow-none bg-transparent hover-bg-light"
              >
                <Languages size={20} className="text-muted" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow-1 p-4 p-lg-5 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 z-index-1050 bg-dark bg-opacity-50 backdrop-filter-blur"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <aside 
        className="position-fixed top-0 start-0 h-100 z-index-1051 sidebar"
        style={{
          width: '280px',
          transform: isMobileSidebarOpen ? 'none' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div className="p-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger rounded-3 p-2 shadow-sm">
              <Radio className="text-white" size={24} />
            </div>
            <span className="fw-800 fs-4 text-white">BantuWave</span>
          </div>
          <button className="btn btn-link text-white p-0" onClick={() => setIsMobileSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-grow-1 overflow-y-auto py-2">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
};

export default DashboardLayout;
