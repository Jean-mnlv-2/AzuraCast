import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Radio, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  Mic,
  Music,
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
  Rss,
  Book,
  Layers,
  DollarSign,
  ClipboardList,
  Megaphone,
  Library,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import Button from '../components/ui/Button';
import logo from '../assets/logo.png';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  isBack?: boolean;
  requiredPermission?: string;
  requiredRole?: string | string[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const params = useParams<{ station_short_name?: string }>();
  const { logout, user } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userRoles = user?.groups?.map(g => g.name) || [];

  const hasRole = (role: string | string[]) => {
    if (user?.is_superuser) return true;
    if (Array.isArray(role)) {
      return role.some(r => userRoles.includes(r));
    }
    return userRoles.includes(role);
  };

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
    { 
      name: "SaaS Manager", 
      href: '/admin', 
      icon: Activity, 
      requiredRole: ['SuperAdmins', 'Commercial & Billing', 'Tech Support', 'Ad Manager', 'Content Curator']
    },
    { 
      name: "Gestion Flotte", 
      href: '/admin/fleet', 
      icon: Layers, 
      requiredRole: ['SuperAdmins', 'Tech Support']
    },
    { 
      name: "Facturation", 
      href: '/admin/billing', 
      icon: DollarSign, 
      requiredRole: ['SuperAdmins', 'Commercial & Billing']
    },
    { 
      name: "Régie Pub", 
      href: '/admin/ads', 
      icon: Megaphone, 
      requiredRole: ['SuperAdmins', 'Ad Manager']
    },
    { 
      name: "Médiathèque", 
      href: '/admin/library', 
      icon: Library, 
      requiredRole: ['SuperAdmins', 'Content Curator']
    },
    { name: "Audit Logs", href: '/admin/audit', icon: ClipboardList, superAdminOnly: true },
    { name: t('nav.users'), href: '/admin/users', icon: Users, superAdminOnly: true },
    { name: t('nav.settings'), href: '/admin/settings', icon: Settings, superAdminOnly: true },
    { name: t('nav.documentation'), href: '/admin/docs', icon: Book },
  ];

  const stationNavigation: NavigationItem[] = [
    { name: t('nav.back_to_dashboard'), href: '/', icon: ChevronLeft, isBack: true },
    { name: t('nav.profile'), href: `/station/${station_short_name}`, icon: LayoutDashboard, requiredPermission: 'view_station' },
    { name: t('nav.media'), href: `/station/${station_short_name}/media`, icon: Music, requiredPermission: 'manage_station_media' },
    { name: t('nav.playlists'), href: `/station/${station_short_name}/playlists`, icon: ListMusic, requiredPermission: 'manage_station_playlists' },
    { name: t('nav.streamers'), href: `/station/${station_short_name}/streamers`, icon: UserCheck, requiredPermission: 'manage_station_streamers' },
    { name: t('nav.webhooks'), href: `/station/${station_short_name}/webhooks`, icon: Share2, requiredPermission: 'manage_station_webhooks' },
    { name: t('nav.mounts'), href: `/station/${station_short_name}/mounts`, icon: Zap, requiredPermission: 'manage_station_mounts' },
    { name: t('nav.remotes'), href: `/station/${station_short_name}/remotes`, icon: Globe, requiredPermission: 'manage_station_remotes' },
    { name: t('nav.hls_streams'), href: `/station/${station_short_name}/hls`, icon: Activity, requiredPermission: 'manage_station_hls' },
    { name: t('nav.sftp_users'), href: `/station/${station_short_name}/sftp`, icon: HardDrive, requiredPermission: 'manage_station_mounts' }, // SFTP often linked to mounts
    { name: t('nav.analytics'), href: `/station/${station_short_name}/analytics`, icon: BarChart3, requiredPermission: 'manage_station_analytics' },
    { name: t('nav.podcasts'), href: `/station/${station_short_name}/podcasts`, icon: Rss, requiredPermission: 'manage_station_podcasts' },
    { name: 'Web-DJ Live', href: `/station/${station_short_name}/web-dj`, icon: Mic, requiredPermission: 'manage_station_streamers' },
    { name: t('stations.configuration'), href: `/station/${station_short_name}/settings`, icon: Settings, requiredPermission: 'manage_station_profile' },
  ];

  const navigation = isStationView ? stationNavigation : globalNavigation;
  const filteredNavigation = navigation.filter(item => {
    if (item.superAdminOnly) return !!user?.is_superuser;
    if (item.requiredRole) return hasRole(item.requiredRole);
    if (item.adminOnly) return !!(user?.is_superuser || user?.is_staff);
    
    // Station specific permissions
    if (isStationView && item.requiredPermission) {
      if (user?.is_superuser) return true;
      
      const userStationPerms = user?.station_permissions?.[station_short_name || ''] || [];
      
      // 'manage_station' gives access to everything
      if (userStationPerms.includes('manage_station')) return true;
      
      return userStationPerms.includes(item.requiredPermission);
    }
    
    return true;
  });

  return (
    <div className="min-vh-100 d-flex dashboard-wrapper">
      {/* Sidebar Desktop */}
      <aside className="sidebar d-none d-lg-flex flex-column" style={{ width: '280px', minWidth: '280px' }}>
        <div className="p-4 mb-3 d-flex align-items-center gap-3">
          <img src={logo} alt="BantuWave Logo" style={{ height: '48px', width: 'auto' }} className="shadow-sm rounded-1" />
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
