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
  ExternalLink,
  Globe,
  Languages,
  Activity,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import CountrySelect from '../../../components/ui/CountrySelect';

interface Station {
  id: number;
  name: string;
  short_name: string;
  is_enabled: boolean;
  frontend_type: string;
  backend_type: string;
  is_streamer_live: boolean;
  needs_restart: boolean;
  logo: string | null;
  logo_external_url: string | null;
}

const StationList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    backend_type: 'liquidsoap',
    frontend_type: 'icecast',
    description: '',
    url: '',
    stream_url: '',
    genre: '',
    language: 'fr',
    country: 'Cameroun',
    logo_external_url: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const isMultipart = data instanceof FormData;
      return axios.post('/stations/', data, {
        headers: {
          'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      setIsCreateModalOpen(false);
      setLogoFile(null);
      setLogoPreview(null);
      setFormData({ 
        name: '', 
        short_name: '', 
        backend_type: 'liquidsoap', 
        frontend_type: 'icecast',
        description: '',
        url: '',
        stream_url: '',
        genre: '',
        language: 'fr',
        country: 'Cameroun',
        logo_external_url: ''
      });
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
    
    let dataToSubmit: any;
    if (logoFile) {
      dataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        dataToSubmit.append(key, value);
      });
      dataToSubmit.append('logo', logoFile);
      dataToSubmit.set('short_name', short_name);
    } else {
      dataToSubmit = {
        ...formData,
        short_name
      };
    }
    
    try {
      await createMutation.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error('Error creating station:', error);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <div className="text-center py-5 my-5">
          <div className="spinner-grow text-primary" role="status"></div>
          <p className="mt-3 text-muted-soft fw-600">Chargement de vos stations...</p>
        </div>
      ) : stations && stations.length > 0 ? (
        <div className="row g-4">
          {stations.map((station) => (
            <div key={station.id} className="col-12 col-xl-6">
              <div className="bw-section h-100 mb-0 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary-soft rounded-4 p-0 text-primary overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', minWidth: '64px' }}>
                      {station.logo_external_url || station.logo ? (
                        <img 
                          src={station.logo_external_url || (station.logo?.startsWith('http') ? station.logo : `${import.meta.env.VITE_API_URL}${station.logo}`)} 
                          alt={station.name} 
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : (
                        <Radio size={32} />
                      )}
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
      ) : (
        <div className="text-center py-5 my-5 bg-white rounded-4 border border-dashed border-2 p-5">
          <div className="bg-primary-soft rounded-circle d-inline-flex p-4 mb-4 text-primary">
            <Radio size={48} />
          </div>
          <h3 className="fw-800 text-main mb-2">Aucune station trouvée</h3>
          <p className="text-muted-soft mb-4 max-w-400 mx-auto">
            Vous n'avez pas encore créé de station de radio. Commencez votre aventure radiophonique dès maintenant en créant votre première station.
          </p>
          <Button 
            variant="danger" 
            pill
            icon={<Plus size={20} />} 
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm px-4"
          >
            Créer ma première station
          </Button>
        </div>
      )}

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title={t('stations.create_modal.title')}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="d-flex flex-column gap-4">
          <div className="row g-4">
            {/* Section 1: Informations de base */}
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <Radio size={20} className="text-primary" />
                <h5 className="fw-800 text-main mb-0">Informations sur la radio</h5>
              </div>
              
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-3">Logo de la radio</label>
                  <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                    <div 
                      className="bg-light-soft rounded-4 d-flex align-items-center justify-content-center overflow-hidden border-2 border-dashed border-muted-soft position-relative hover-bg-light transition-all cursor-pointer" 
                      style={{ width: '120px', height: '120px', minWidth: '120px' }}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon size={24} className="text-muted-soft mb-1" />
                          <div className="smaller text-muted-soft fw-600">Upload</div>
                        </div>
                      )}
                      <input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="d-none" 
                        onChange={handleLogoChange} 
                      />
                    </div>
                    
                    <div className="flex-grow-1 w-100">
                      <Input 
                        label="Ou lien vers le logo (URL)" 
                        placeholder="https://exemple.com/logo.png"
                        value={formData.logo_external_url}
                        onChange={e => setFormData({...formData, logo_external_url: e.target.value})}
                        icon={<LinkIcon size={16} className="text-muted-soft" />}
                        helperText="Si vous utilisez un lien externe, il sera privilégié sur l'upload local."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <Input 
                    label={t('stations.create_modal.name')} 
                    placeholder="ex: MNLV Radio"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    icon={<Radio size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label={t('stations.create_modal.slug')} 
                    placeholder="ex: mnlv-radio"
                    value={formData.short_name}
                    onChange={e => setFormData({...formData, short_name: e.target.value})}
                    helperText={t('stations.create_modal.slug_help')}
                    icon={<Globe size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label="URL du flux (streaming)" 
                    placeholder="https://stream.mnlv.com/live"
                    value={formData.stream_url}
                    onChange={e => setFormData({...formData, stream_url: e.target.value})}
                    icon={<Activity size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-md-6">
                  <Input 
                    label="Site web" 
                    placeholder="https://mnlvmedia.com"
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    icon={<Globe size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-12">
                  <div className="mb-0">
                    <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">Description</label>
                    <textarea 
                      className="form-control border-0 bg-light-soft rounded-3 py-2"
                      rows={3}
                      placeholder="Radio en ligne dédiée à la musique urbaine..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                <div className="col-md-4">
                  <Input 
                    label="Catégorie" 
                    placeholder="Musique / Actualités"
                    value={formData.genre}
                    onChange={e => setFormData({...formData, genre: e.target.value})}
                    icon={<Music size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-md-4">
                  <Input 
                    label="Langue principale" 
                    placeholder="Français"
                    value={formData.language}
                    onChange={e => setFormData({...formData, language: e.target.value})}
                    icon={<Languages size={16} className="text-muted-soft" />}
                  />
                </div>
                <div className="col-md-4">
                  <CountrySelect
                    label="Pays"
                    value={formData.country}
                    onChange={(val) => setFormData({ ...formData, country: val })}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Configuration technique */}
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                <Settings size={20} className="text-primary" />
                <h5 className="fw-800 text-main mb-0">Configuration technique</h5>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <div className="mb-0">
                    <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">{t('stations.create_modal.backend_type')}</label>
                    <select 
                      className="form-select border-0 bg-light-soft rounded-3 py-2"
                      value={formData.backend_type}
                      onChange={e => setFormData({...formData, backend_type: e.target.value})}
                    >
                      <option value="liquidsoap">Liquidsoap</option>
                      <option value="none">Aucun</option>
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="mb-0">
                    <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">{t('stations.create_modal.frontend_type')}</label>
                    <select 
                      className="form-select border-0 bg-light-soft rounded-3 py-2"
                      value={formData.frontend_type}
                      onChange={e => setFormData({...formData, frontend_type: e.target.value})}
                    >
                      <option value="icecast">Icecast</option>
                      <option value="shoutcast">Shoutcast</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-2 pt-4 border-top">
            <Button variant="light" onClick={() => setIsCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="danger" loading={createMutation.isPending} icon={<Plus size={18} />}>{t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationList;
