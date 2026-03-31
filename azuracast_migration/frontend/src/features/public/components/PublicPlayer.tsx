import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Radio, 
  History, 
  MessageSquare,
  Share2,
  AlertCircle,
  ChevronLeft,
  Settings
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';

interface NowPlaying {
  station: {
    id: number;
    name: string;
    short_name: string;
    description: string;
    logo?: string;
    logo_external_url?: string;
    branding_config?: {
      primary_color?: string;
      secondary_color?: string;
      show_social_widgets?: boolean;
      twitter_handle?: string;
      instagram_handle?: string;
    };
  };
  now_playing: {
    song: {
      title: string;
      artist: string;
      art: string;
    };
    elapsed: number;
    duration: number;
  };
  song_history: Array<{
    song: {
      title: string;
      artist: string;
    };
    played_at: number;
  }>;
}

const PublicPlayer: React.FC = () => {
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hlsSupported, setHlsSupported] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await axios.get(`/nowplaying/${station_short_name}/`);
        setNowPlaying(response.data);
        setError(null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Cette station n'existe pas ou n'a pas encore de données de diffusion.");
        } else {
          setError("Impossible de charger les données de la station.");
        }
        console.error('Error fetching now playing data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, [station_short_name]);

  // HLS Initialization
  useEffect(() => {
    if (!nowPlaying || !audioRef.current) return;

    const streamUrl = `${import.meta.env.VITE_API_URL}/api/stations/${nowPlaying.station.short_name}/hls/live/playlist.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        fragLoadingTimeOut: 10000,
        manifestLoadingTimeOut: 10000,
      });
      
      hls.loadSource(streamUrl);
      hls.attachMedia(audioRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) audioRef.current?.play();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      audioRef.current.src = streamUrl;
    } else {
      setHlsSupported(false);
    }
  }, [nowPlaying, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => setIsMuted(!isMuted);

  if (isLoading) {
    return (
      <div className="public-player-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-grow text-white mb-3" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-white opacity-75 fw-bold">Initialisation du flux...</p>
        </div>
      </div>
    );
  }

  if (error || !nowPlaying) {
    return (
      <div className="public-player-bg min-vh-100 d-flex justify-content-center align-items-center p-4">
        <div className="blur-card rounded-5 p-5 text-center shadow-xl" style={{ maxWidth: '500px' }}>
          <div className="bg-danger bg-opacity-20 text-danger rounded-circle d-inline-flex p-4 mb-4">
            <AlertCircle size={48} />
          </div>
          <h2 className="fw-bold text-white mb-3">Oups !</h2>
          <p className="text-white opacity-75 mb-5 fs-5">
            {error || "Nous n'avons pas pu trouver les informations de diffusion pour cette station."}
          </p>
          <Link to="/" className="btn btn-light rounded-pill px-5 py-3 fw-bold d-inline-flex align-items-center gap-2">
            <ChevronLeft size={20} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const currentSong = nowPlaying.now_playing?.song || { title: 'Flux en direct', artist: nowPlaying.station.name, art: '' };
  const progress = nowPlaying.now_playing?.duration ? (nowPlaying.now_playing.elapsed / nowPlaying.now_playing.duration) * 100 : 0;
  
  // Custom Branding Logic
  const primaryColor = nowPlaying.station.branding_config?.primary_color || '#F97316';
  const showSocials = nowPlaying.station.branding_config?.show_social_widgets !== false;
  const stationLogo = nowPlaying.station.logo_external_url || (nowPlaying.station.logo ? (nowPlaying.station.logo.startsWith('http') ? nowPlaying.station.logo : `${import.meta.env.VITE_API_URL}${nowPlaying.station.logo}`) : null);

  return (
    <div className="public-player-bg min-vh-100 d-flex flex-column align-items-center justify-content-center py-5">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} />

      {/* Background Blur Image */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 z-index-0" 
        style={{ 
          backgroundImage: `url(${currentSong.art || stationLogo || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.4)',
          transform: 'scale(1.1)'
        }}
      ></div>

      <div className="container position-relative z-index-1" style={{ maxWidth: '900px' }}>
        <div className="row g-4 align-items-stretch">
          {/* Main Player Card */}
          <div className="col-lg-7">
            <div className="blur-card rounded-5 p-5 h-100 shadow-xl d-flex flex-column justify-content-between">
              <div className="text-center mb-5">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                  <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '32px', height: '32px' }}>
                    {stationLogo ? (
                      <img src={stationLogo} alt="Logo" className="w-100 h-100 object-fit-cover" />
                    ) : (
                      <Radio size={18} className="text-primary" />
                    )}
                  </div>
                  <span className="fw-bold tracking-tight text-white opacity-75">{nowPlaying.station.name}</span>
                </div>
                
                <div className="position-relative d-inline-block mb-5">
                  <div className="rounded-4 overflow-hidden shadow-2xl mx-auto" style={{ width: '280px', height: '280px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    {currentSong.art || stationLogo ? (
                      <img 
                        src={currentSong.art || stationLogo || ''} 
                        alt="Album Art" 
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                        <Music size={80} className="text-white opacity-20" />
                      </div>
                    )}
                  </div>
                  {isPlaying && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                       <div className="pulse-ring"></div>
                    </div>
                  )}
                </div>

                <h2 className="fw-bold tracking-tight mb-2 text-white">{currentSong.title}</h2>
                <p className="fs-5 text-white opacity-75 mb-0">{currentSong.artist}</p>
                {!hlsSupported && (
                  <p className="small text-danger mt-3 fw-bold">Votre navigateur ne supporte pas le streaming HLS.</p>
                )}
              </div>

              <div>
                <div className="mb-2">
                  <div className="progress bg-white bg-opacity-20 rounded-pill overflow-hidden" style={{ height: '6px' }}>
                    <div 
                      className="progress-bar transition-all duration-1000" 
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: primaryColor
                      }}
                    ></div>
                  </div>
                  {nowPlaying.now_playing && (
                    <div className="d-flex justify-content-between mt-2 small text-white opacity-50 fw-bold">
                      <span>{Math.floor(nowPlaying.now_playing.elapsed / 60)}:{(nowPlaying.now_playing.elapsed % 60).toString().padStart(2, '0')}</span>
                      <span>{Math.floor(nowPlaying.now_playing.duration / 60)}:{(nowPlaying.now_playing.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3 w-25">
                    <button className="btn btn-link text-white p-0 shadow-none opacity-75 hover-opacity-100" onClick={toggleMute}>
                      {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <input 
                      type="range" 
                      className="form-range custom-range" 
                      min="0" max="100" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                    />
                  </div>

                  <button 
                    className="btn bg-white text-dark rounded-circle p-4 shadow-lg hover-scale d-flex align-items-center justify-content-center" 
                    onClick={togglePlay}
                    style={{ width: '80px', height: '80px' }}
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ms-1" />}
                  </button>

                  <div className="d-flex align-items-center gap-3 w-25 justify-content-end">
                    <button className="btn btn-link text-white p-0 shadow-none opacity-75 hover-opacity-100" title="Options de qualité">
                      <Settings size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Tabs */}
          <div className="col-lg-5">
            <div className="blur-card rounded-5 p-4 h-100 shadow-xl overflow-hidden d-flex flex-column">
              <ul className="nav nav-pills bg-white bg-opacity-10 rounded-pill p-1 mb-4">
                <li className="nav-item flex-grow-1">
                  <button className="nav-link active rounded-pill py-2 w-100 d-flex align-items-center justify-content-center gap-2">
                    <History size={18} /> Historique
                  </button>
                </li>
                <li className="nav-item flex-grow-1">
                  <button className="nav-link text-white opacity-75 rounded-pill py-2 w-100 d-flex align-items-center justify-content-center gap-2">
                    <MessageSquare size={18} /> Dédicaces
                  </button>
                </li>
              </ul>

              <div className="flex-grow-1 overflow-auto pe-2">
                {nowPlaying.song_history?.length > 0 ? (
                  nowPlaying.song_history.map((item, index) => (
                    <div key={index} className="d-flex align-items-center gap-3 p-3 rounded-4 mb-2 hover-bg-white-10 transition-all">
                      <div className="bg-white bg-opacity-10 rounded-3 p-2 text-white">
                        <Music size={20} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="mb-0 fw-bold text-white text-truncate">{item.song.title}</p>
                        <p className="mb-0 small text-white opacity-50 text-truncate">{item.song.artist}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 opacity-50">
                    <History size={40} className="mb-2" />
                    <p>Aucun historique disponible</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-top border-white border-opacity-10">
                <Button 
                  style={{ backgroundColor: primaryColor, border: 'none' }} 
                  className="w-100 py-3 rounded-4 fw-bold"
                >
                  Faire une dédicace
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {showSocials && (
          <div className="mt-5 d-flex justify-content-center gap-4">
            {nowPlaying.station.branding_config?.twitter_handle && (
              <a href={`https://twitter.com/${nowPlaying.station.branding_config.twitter_handle}`} target="_blank" rel="noreferrer" className="text-white opacity-50 hover-opacity-100">
                <Share2 size={24} />
              </a>
            )}
            {nowPlaying.station.branding_config?.instagram_handle && (
              <a href={`https://instagram.com/${nowPlaying.station.branding_config.instagram_handle}`} target="_blank" rel="noreferrer" className="text-white opacity-50 hover-opacity-100">
                <Share2 size={24} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPlayer;
