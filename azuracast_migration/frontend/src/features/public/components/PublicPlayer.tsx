import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Radio, 
  History, 
  Calendar,
  MessageSquare,
  Share2
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';

interface NowPlaying {
  station: {
    name: string;
    description: string;
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

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await axios.get(`/nowplaying/${station_short_name}/`);
        setNowPlaying(response.data);
      } catch (err) {
        console.error('Error fetching now playing data', err);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, [station_short_name]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  if (!nowPlaying) {
    return (
      <div className="public-player-bg d-flex justify-content-center align-items-center">
        <div className="spinner-grow text-white" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  const currentSong = nowPlaying.now_playing.song;
  const progress = (nowPlaying.now_playing.elapsed / nowPlaying.now_playing.duration) * 100;
  
  // Custom Branding Logic
  const primaryColor = nowPlaying.station.branding_config?.primary_color || '#D32F2F';
  const showSocials = nowPlaying.station.branding_config?.show_social_widgets !== false;

  return (
    <div className="public-player-bg min-vh-100 d-flex flex-column align-items-center justify-content-center py-5">
      {/* Background Blur Image */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 z-index-0" 
        style={{ 
          backgroundImage: `url(${currentSong.art || 'https://via.placeholder.com/800'})`,
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
                  <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                    <Radio size={18} className="text-danger" />
                  </div>
                  <span className="fw-bold tracking-tight text-white opacity-75">{nowPlaying.station.name}</span>
                </div>
                
                <div className="position-relative d-inline-block mb-5">
                  <div className="rounded-4 overflow-hidden shadow-2xl mx-auto" style={{ width: '280px', height: '280px' }}>
                    <img 
                      src={currentSong.art || 'https://via.placeholder.com/300'} 
                      alt="Album Art" 
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  {isPlaying && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                       <div className="pulse-ring"></div>
                    </div>
                  )}
                </div>

                <h2 className="fw-bold tracking-tight mb-2 text-white">{currentSong.title}</h2>
                <p className="fs-5 text-white opacity-75 mb-0">{currentSong.artist}</p>
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
                  <div className="d-flex justify-content-between mt-2 small text-white opacity-50 fw-bold">
                    <span>{Math.floor(nowPlaying.now_playing.elapsed / 60)}:{(nowPlaying.now_playing.elapsed % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(nowPlaying.now_playing.duration / 60)}:{(nowPlaying.now_playing.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
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
                    className="btn bg-white text-dark rounded-circle p-4 shadow-lg hover-scale" 
                    onClick={togglePlay}
                    style={{ width: '80px', height: '80px' }}
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ms-1" />}
                  </button>

                  <div className="d-flex align-items-center gap-3 w-25 justify-content-end">
                    <button className="btn btn-link text-white p-0 shadow-none opacity-75 hover-opacity-100">
                      <Share2 size={24} />
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
                {nowPlaying.song_history.map((item, index) => (
                  <div key={index} className="d-flex align-items-center gap-3 p-3 rounded-4 mb-2 hover-bg-white-10 transition-all">
                    <div className="bg-white bg-opacity-10 rounded-3 p-2 text-white">
                      <Music size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="mb-0 fw-bold text-white text-truncate">{item.song.title}</p>
                      <p className="mb-0 small text-white opacity-50 text-truncate">{item.song.artist}</p>
                    </div>
                  </div>
                ))}
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

      <style>{`
        .hover-scale:hover { transform: scale(1.05); }
        .hover-bg-white-10:hover { background: rgba(255, 255, 255, 0.1); }
        .hover-opacity-100:hover { opacity: 1 !important; }
        .custom-range::-webkit-slider-runnable-track { background: rgba(255, 255, 255, 0.2); border-radius: 10px; height: 4px; }
        .custom-range::-webkit-slider-thumb { background: white; margin-top: -6px; height: 16px; width: 16px; border-radius: 50%; }
        .pulse-ring {
          position: absolute;
          width: 300px;
          height: 300px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PublicPlayer;
