import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Play, Square, Activity, Volume2, Settings as SettingsIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const WebDj: React.FC = () => {
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const { t } = useTranslation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(100);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const { data: station } = useQuery({
    queryKey: ['station', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stations/${station_short_name}/`);
      return response.data;
    }
  });

  const startStreaming = async () => {
    try {
      setIsStreaming(true);
      console.log("Starting stream to harbor...");
    } catch (error) {
      console.error("Failed to start stream", error);
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    console.log("Stream stopped.");
  };

  const toggleMic = async () => {
    if (!isMicOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyzerRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyzerRef.current);
        
        setIsMicOn(true);
        visualize();
      } catch (err) {
        console.error("Microphone access denied", err);
      }
    } else {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      setIsMicOn(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const visualize = () => {
    if (!analyzerRef.current) return;
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    // Logic for visualizer (Canvas or CSS bars)
    animationFrameRef.current = requestAnimationFrame(visualize);
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="fw-800 text-main mb-1">{t('nav.web-dj', 'Web-DJ Live')}</h1>
        <p className="text-muted small">Diffusez en direct depuis votre navigateur</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bw-section p-4 mb-4 bg-dark text-white position-relative overflow-hidden" style={{ minHeight: '300px' }}>
            {/* Visualizer Background */}
            <div className="position-absolute top-50 start-50 translate-middle opacity-20">
              <Activity size={200} className={isMicOn ? 'text-primary animate-pulse' : 'text-muted'} />
            </div>

            <div className="position-relative z-index-1 h-100 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="badge bg-danger p-2 px-3 ls-1 fw-bold" style={{ display: isStreaming ? 'block' : 'none' }}>LIVE</div>
                <div className="small text-muted-soft">Station: {station?.name}</div>
              </div>

              <div className="text-center mb-5">
                <div className="display-4 fw-800 mb-2">00:00:00</div>
                <p className="small text-muted-soft uppercase ls-2">Durée du Direct</p>
              </div>

              <div className="d-flex justify-content-center gap-4 align-items-center mt-auto">
                <Button 
                  variant={isMicOn ? "primary" : "light"} 
                  className="rounded-circle p-4 shadow"
                  onClick={toggleMic}
                >
                  {isMicOn ? <Mic size={32} /> : <MicOff size={32} />}
                </Button>
                
                {!isStreaming ? (
                  <Button 
                    variant="success" 
                    className="rounded-pill px-5 py-3 fw-bold ls-1 shadow-lg"
                    icon={<Play size={20} />}
                    onClick={startStreaming}
                  >
                    PRENDRE L'ANTENNE
                  </Button>
                ) : (
                  <Button 
                    variant="danger" 
                    className="rounded-pill px-5 py-3 fw-bold ls-1 shadow-lg"
                    icon={<Square size={20} />}
                    onClick={stopStreaming}
                  >
                    ARRÊTER LE DIRECT
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="bw-section p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Volume2 size={20} className="text-primary" /> Contrôle Audio
            </h5>
            <div className="d-flex align-items-center gap-3">
              <span className="small text-muted fw-600">Volume Musique (Ducking: 20%)</span>
              <input 
                type="range" 
                className="form-range flex-grow-1" 
                value={volume} 
                onChange={(e) => setVolume(parseInt(e.target.value))} 
              />
              <span className="small fw-bold">{volume}%</span>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="bw-section p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <SettingsIcon size={20} className="text-primary" /> Paramètres de Connexion
            </h5>
            <Input 
              label="Nom d'utilisateur DJ" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="ex: dj_bantu"
            />
            <Input 
              label="Mot de passe" 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div className="mt-3 p-3 bg-light rounded small text-muted">
              <strong>Info:</strong> Ces identifiants sont utilisés pour l'authentification sécurisée avec Liquidsoap Harbor.
            </div>
          </div>

          <div className="bw-section p-4 border-start border-primary border-4">
            <h6 className="fw-bold mb-2">Auto-Recording Actif</h6>
            <p className="small text-muted mb-0">
              Votre session en direct est automatiquement enregistrée et sera disponible dans le module <strong>Podcasts</strong> dès la fin de votre diffusion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebDj;
