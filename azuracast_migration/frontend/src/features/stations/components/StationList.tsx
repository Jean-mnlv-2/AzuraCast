import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Radio, 
  Settings, 
  Play, 
  Square, 
  RefreshCw, 
  MoreVertical,
  Music,
  Users,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface Station {
  id: number;
  name: string;
  short_name: string;
  is_enabled: boolean;
  frontend_type: string;
  backend_type: string;
  is_streamer_live: boolean;
  needs_restart: boolean;
}

const StationList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    backend_type: 'liquidsoap',
    frontend_type: 'icecast'
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => axios.post('/stations/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', short_name: '', backend_type: 'liquidsoap', frontend_type: 'icecast' });
    },
    onError: (error: any) => {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`Erreur lors de la création : ${msg}`);
    }
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const short_name = formData.short_name || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const dataToSubmit = {
      ...formData,
      short_name
    };
    
    try {
      await createMutation.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error('Error creating station:', error);
    }
  };

  const { data: stations, isLoading } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await axios.get('/stations/');
      return response.data;
    },
  });

  const restartMutation = useMutation({
    mutationFn: (short_name: string) => axios.post(`/stations/${short_name}/restart/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      // Optionnel: ajouter un toast de succès ici
    },
  });

  const stopMutation = useMutation({
    mutationFn: (short_name: string) => axios.post(`/stations/${short_name}/stop/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h1 className="fw-800 text-main mb-1">Stations de Radio</h1>
          <p className="text-muted-soft mb-0">Gérez et diffusez sur vos stations BantuWave</p>
        </div>
        <Button 
          variant="danger" 
          pill
          icon={<Plus size={20} />} 
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-sm px-4"
        >
          {t('stations.add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3 text-muted-soft">Chargement de vos stations...</p>
        </div>
      ) : (
        <div className="row g-4">
          {stations?.map((station) => (
            <div key={station.id} className="col-12 col-xl-6">
              <div className="bw-section h-100 mb-0 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary-soft rounded-4 p-3 text-primary">
                      <Radio size={32} />
                    </div>
                    <div>
                      <h4 className="fw-700 text-main mb-1">{station.name}</h4>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${station.is_enabled ? 'bg-success' : 'bg-secondary'} rounded-pill px-2`}>
                          {station.is_enabled ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-muted-soft small">/{station.short_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown">
                    <button className="btn btn-light btn-sm rounded-circle p-2 border-0 shadow-none bg-light-soft" data-bs-toggle="dropdown">
                      <MoreVertical size={18} />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                      <li><Link className="dropdown-item py-2" to={`/station/${station.short_name}/settings`}><Settings size={16} className="me-2" /> {t('common.settings')}</Link></li>
                      <li><hr className="dropdown-divider opacity-50" /></li>
                      <li>
                        <button 
                          className="dropdown-item py-2 text-danger" 
                          onClick={() => stopMutation.mutate(station.short_name)}
                          disabled={stopMutation.isPending}
                        >
                          <Square size={16} className="me-2" /> {t('stations.stop')}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="row g-3 mb-4 mt-auto">
                  <div className="col-6">
                    <div className="p-3 rounded-3 bg-light-soft border border-white">
                      <p className="text-muted-soft small text-uppercase fw-700 ls-1 mb-1">Moteur</p>
                      <p className="text-main fw-600 mb-0">{station.backend_type}</p>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-3 bg-light-soft border border-white">
                      <p className="text-muted-soft small text-uppercase fw-700 ls-1 mb-1">Diffusion</p>
                      <p className="text-main fw-600 mb-0">{station.frontend_type}</p>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <Button 
                    variant={station.needs_restart ? "danger" : "primary"}
                    className="flex-grow-1"
                    as={station.needs_restart ? undefined : Link}
                    to={station.needs_restart ? undefined : `/station/${station.short_name}`}
                    onClick={() => {
                      if (station.needs_restart) {
                        restartMutation.mutate(station.short_name);
                      }
                    }}
                    loading={restartMutation.isPending && restartMutation.variables === station.short_name}
                    icon={station.needs_restart ? <RefreshCw size={18} /> : <Play size={18} />}
                  >
                    {station.needs_restart ? t('stations.restart_required') : t('stations.manage')}
                  </Button>
                  
                  <Link 
                    to={`/public/${station.short_name}`} 
                    target="_blank"
                    className="btn btn-light border-0 bg-light-soft p-2.5 d-flex align-items-center justify-content-center rounded-3 transition-all"
                    title="Page Publique"
                  >
                    <ExternalLink size={20} className="text-muted" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Nouvelle Station BantuWave"
      >
        <form onSubmit={handleCreateSubmit}>
          <Input 
            label="Nom de la Station" 
            placeholder="ex: Ma Radio Live"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <Input 
            label="Identifiant URL (Optionnel)" 
            placeholder="ex: ma-radio-live"
            value={formData.short_name}
            onChange={e => setFormData({...formData, short_name: e.target.value})}
            helperText="Sera généré automatiquement si vide."
          />
          
          <div className="row">
            <div className="col-6">
              <div className="mb-4">
                <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">Moteur Audio</label>
                <select 
                  className="form-select"
                  value={formData.backend_type}
                  onChange={e => setFormData({...formData, backend_type: e.target.value})}
                >
                  <option value="liquidsoap">Liquidsoap</option>
                  <option value="none">Aucun</option>
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="mb-4">
                <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">Diffusion</label>
                <select 
                  className="form-select"
                  value={formData.frontend_type}
                  onChange={e => setFormData({...formData, frontend_type: e.target.value})}
                >
                  <option value="icecast">Icecast</option>
                  <option value="shoutcast">Shoutcast</option>
                </select>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="danger" loading={createMutation.isPending}>Créer la Station</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationList;
