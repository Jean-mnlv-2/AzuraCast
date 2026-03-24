import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { 
  Radio, 
  Play, 
  Clock, 
  Users, 
  Activity, 
  Zap, 
  Share2, 
  Music,
  ExternalLink,
  RefreshCw,
  Settings,
  Calendar,
  Mic
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

interface StationProfileData {
  id: number;
  name: string;
  short_name: string;
  is_enabled: boolean;
  is_streamer_live: boolean;
  services: {
    backend_running: boolean;
    frontend_running: boolean;
  };
  now_playing?: {
    song: {
      title: string;
      artist: string;
      art: string;
    };
    elapsed: number;
    duration: number;
  };
  schedule: any[];
}

const StationProfile: React.FC = () => {
  const { station_short_name } = useParams<{ station_short_name: string }>();

  const { data: station, isLoading, refetch } = useQuery<StationProfileData>({
    queryKey: ['station_profile', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/profile/`);
      return response.data;
    },
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/stations/${station_short_name}/restart/`);
    },
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  if (!station) return <div>Station non trouvée</div>;

  const progress = station.now_playing 
    ? (station.now_playing.elapsed / station.now_playing.duration) * 100 
    : 0;

  return (
    <div className="container-fluid px-0">
      {/* Header Profile */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-4">
        <div className="d-flex align-items-center gap-4">
          <div className="bg-primary-soft rounded-4 p-4 text-primary shadow-sm">
            <Radio size={48} />
          </div>
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb small text-uppercase fw-700 ls-1 mb-2">
                <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted-soft">Dashboard</Link></li>
                <li className="breadcrumb-item text-primary active" aria-current="page">{station.name}</li>
              </ol>
            </nav>
            <h1 className="fw-800 text-main mb-0">{station.name}</h1>
            <div className="d-flex align-items-center gap-3 mt-2">
              <span className={`badge ${station.is_enabled ? 'bg-success' : 'bg-secondary'} rounded-pill px-3`}>
                {station.is_enabled ? 'En ligne' : 'Hors ligne'}
              </span>
              {station.is_streamer_live && (
                <span className="badge bg-danger rounded-pill px-3 animate-pulse">LIVE DJ</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button variant="light" icon={<Settings size={18} />} as={Link} to={`/station/${station.short_name}/settings`}>
            Paramètres
          </Button>
          <Button variant="primary" icon={<RefreshCw size={18} />} onClick={() => restartMutation.mutate()} loading={restartMutation.isPending}>
            Redémarrer
          </Button>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Column */}
        <div className="col-12 col-xl-8">
          {/* Now Playing Player */}
          <div className="bw-section mb-4 p-0 overflow-hidden border-0 shadow-lg">
            <div className="row g-0">
              <div className="col-md-4">
                <div className="ratio ratio-1x1 bg-dark d-flex align-items-center justify-content-center">
                  {station.now_playing?.song.art ? (
                    <img src={station.now_playing.song.art} alt="Art" className="object-fit-cover" />
                  ) : (
                    <Music size={64} className="text-white opacity-20" />
                  )}
                </div>
              </div>
              <div className="col-md-8 p-4 d-flex flex-column justify-content-center bg-surface">
                <div className="mb-4">
                  <p className="text-primary fw-700 small text-uppercase ls-1 mb-2">En cours de lecture</p>
                  <h2 className="fw-800 text-main mb-1 text-truncate">{station.now_playing?.song.title || 'AutoDJ'}</h2>
                  <h5 className="text-muted-soft fw-600 mb-0 text-truncate">{station.now_playing?.song.artist || 'BantuWave Radio'}</h5>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-600 text-muted-soft mb-2">
                    <span>{Math.floor((station.now_playing?.elapsed || 0) / 60)}:{( (station.now_playing?.elapsed || 0) % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor((station.now_playing?.duration || 0) / 60)}:{( (station.now_playing?.duration || 0) % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="progress rounded-pill bg-light-soft" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-primary rounded-pill transition-all" 
                      role="progressbar" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-center">
                  <button className="btn btn-primary rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '56px', height: '56px' }}>
                    <Play fill="currentColor" size={24} />
                  </button>
                  <div className="d-flex align-items-center gap-4 ms-2">
                    <div className="text-center">
                      <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-0">Auditeurs</p>
                      <p className="text-main fw-800 mb-0">124</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-0">Qualité</p>
                      <p className="text-main fw-800 mb-0">320kbps</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="bw-card-flat p-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-success-soft text-success p-2 rounded-3"><Activity size={20} /></div>
                  <h6 className="fw-700 mb-0">Backend</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className={`rounded-circle ${station.services.backend_running ? 'bg-success' : 'bg-danger'}`} style={{ width: '10px', height: '10px' }}></div>
                  <span className="fw-600 small">{station.services.backend_running ? 'Opérationnel' : 'Arrêté'}</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bw-card-flat p-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-info-soft text-info p-2 rounded-3"><Zap size={20} /></div>
                  <h6 className="fw-700 mb-0">Frontend</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className={`rounded-circle ${station.services.frontend_running ? 'bg-success' : 'bg-danger'}`} style={{ width: '10px', height: '10px' }}></div>
                  <span className="fw-600 small">{station.services.frontend_running ? 'Opérationnel' : 'Arrêté'}</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bw-card-flat p-4 h-100">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="bg-danger-soft text-danger p-2 rounded-3"><Mic size={20} /></div>
                  <h6 className="fw-700 mb-0">Source Live</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className={`rounded-circle ${station.is_streamer_live ? 'bg-success' : 'bg-secondary'}`} style={{ width: '10px', height: '10px' }}></div>
                  <span className="fw-600 small">{station.is_streamer_live ? 'Connecté' : 'Inactif'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="col-12 col-xl-4">
          <div className="bw-section h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h5 className="fw-800 text-main mb-0 d-flex align-items-center gap-2">
                <Calendar size={20} className="text-primary" /> Planning
              </h5>
              <Button variant="link" size="sm" className="p-0 text-primary fw-700">Voir tout</Button>
            </div>

            <div className="d-flex flex-column gap-3">
              {station.schedule.length > 0 ? (
                station.schedule.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-3 bg-light-soft border border-white-soft">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <p className="fw-700 text-main mb-0 small">{item.name}</p>
                      <span className="badge bg-primary-soft text-primary smaller">Live</span>
                    </div>
                    <p className="text-muted-soft smaller fw-600 mb-0">
                      <Clock size={12} className="me-1" /> {item.start_time} - {item.end_time}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-5">
                  <Calendar size={32} className="text-muted-soft opacity-20 mb-3" />
                  <p className="text-muted-soft small fw-600">Aucun événement prévu</p>
                </div>
              )}
            </div>

            <div className="mt-5">
              <h5 className="fw-800 text-main mb-4">Actions Rapides</h5>
              <div className="row g-2">
                <div className="col-6">
                  <Link to={`/station/${station.short_name}/media`} className="btn btn-light w-100 py-3 rounded-3 border-0 bg-light-soft text-main fw-700 small">
                    <Music size={18} className="d-block mx-auto mb-2 text-primary" /> Médias
                  </Link>
                </div>
                <div className="col-6">
                  <Link to={`/station/${station.short_name}/playlists`} className="btn btn-light w-100 py-3 rounded-3 border-0 bg-light-soft text-main fw-700 small">
                    <Zap size={18} className="d-block mx-auto mb-2 text-warning" /> Playlists
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationProfile;
