import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, Search, User, Settings, ExternalLink, Play, Square, FileText } from 'lucide-react';
import { countries } from '../../../utils/countries';
import CountryFlag from '../../../components/ui/CountryFlag';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';

interface StationData {
  id: number;
  name: string;
  short_name: string;
  is_enabled: boolean;
  has_started: boolean;
  plan: string;
  country: string;
  logo: string | null;
  logo_external_url: string | null;
  creator_details: {
    email: string;
    name: string;
  } | null;
  created_at: string;
}

const AdminStationList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLogs, setActiveLogs] = useState('');
  const [logStationName, setLogStationName] = useState('');

  const { data: stations, isLoading } = useQuery<StationData[]>({
    queryKey: ['admin-stations'],
    queryFn: async () => {
      const response = await api.get('/stations/');
      return response.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ short_name, is_enabled }: { short_name: string; is_enabled: boolean }) => {
      return api.patch(`/stations/${short_name}/`, { is_enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stations'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: (short_name: string) => api.post(`/stations/${short_name}/restart/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-stations'] }),
  });

  const stopMutation = useMutation({
    mutationFn: (short_name: string) => api.post(`/stations/${short_name}/stop/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-stations'] }),
  });

  const fetchLogs = async (short_name: string, name: string) => {
    try {
      const response = await api.get(`/stations/${short_name}/logs/`);
      setActiveLogs(response.data.logs);
      setLogStationName(name);
      setLogModalOpen(true);
    } catch {
      alert('Impossible de récupérer les logs.');
    }
  };

  const filteredStations = stations?.filter(
    (station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.creator_details?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.creator_details?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, any> = {
      free: { label: 'Gratuit', class: 'bg-secondary-soft text-muted' },
      pro: { label: 'Pro', class: 'bg-primary-soft text-primary' },
      business: { label: 'Business', class: 'bg-success-soft text-success' },
      enterprise: { label: 'Enterprise', class: 'bg-warning-soft text-warning' },
    };
    const p = plans[plan] || plans.free;
    return <span className={`badge ${p.class} rounded-pill px-2 smaller fw-700`}>{p.label}</span>;
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">Station Manager</h1>
          <p className="text-muted-soft mb-0">Pilotez les stations radio et assistez vos clients</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <div className="mb-4">
          <Input
            placeholder="Rechercher par nom, slug, créateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} className="text-muted-soft" />}
          />
        </div>

        <div className="table-responsive rounded-4 overflow-hidden border border-light-soft">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light-soft text-main fw-bold small text-uppercase ls-1">
              <tr>
                <th className="px-4 py-3 border-0">Station</th>
                <th className="px-4 py-3 border-0">Propriétaire</th>
                <th className="px-4 py-3 border-0 text-center">Abonnement</th>
                <th className="px-4 py-3 border-0 text-center">Service</th>
                <th className="px-4 py-3 border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {filteredStations?.map((station) => (
                <tr key={station.id} className="transition-all hover-bg-light-soft">
                  <td className="px-4 py-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary-soft text-primary rounded-4 d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                        {station.logo_external_url || station.logo ? (
                          <img 
                            src={station.logo_external_url || (station.logo?.startsWith('http') ? station.logo : `${import.meta.env.VITE_API_URL}${station.logo}`)} 
                            alt={station.name} 
                            className="w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          <Radio size={24} />
                        )}
                      </div>
                      <div>
                        <div className="fw-800 text-main mb-0">{station.name}</div>
                        <div className="d-flex align-items-center gap-2">
                          <CountryFlag iso={countries.find(c => c.name === station.country)?.iso || ''} size="sm" />
                          <span className="smaller text-muted-soft fw-600">/{station.short_name}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-light-soft p-2 rounded-circle">
                        <User size={14} className="text-muted-soft" />
                      </div>
                      <div className="small">
                        <div className="fw-700 text-main">{station.creator_details?.name || 'Sans nom'}</div>
                        <div className="text-muted-soft smaller">{station.creator_details?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {getPlanBadge(station.plan)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="d-flex flex-column align-items-center gap-1">
                      <button 
                        className={`badge ${station.is_enabled ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'} rounded-pill px-2 smaller fw-bold border-0 cursor-pointer`}
                        onClick={() => {
                          if (window.confirm(`Voulez-vous ${station.is_enabled ? 'suspendre' : 'activer'} cette station ?`)) {
                            toggleMutation.mutate({ short_name: station.short_name, is_enabled: !station.is_enabled });
                          }
                        }}
                        disabled={toggleMutation.isPending}
                      >
                        {station.is_enabled ? 'Compte Actif' : 'Compte Suspendu'}
                      </button>
                      <span className={`badge ${station.has_started ? 'bg-info-soft text-info' : 'bg-secondary-soft text-muted'} rounded-pill px-2 smaller fw-bold`}>
                        {station.has_started ? 'Flux ON' : 'Flux OFF'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-end">
                    <div className="d-flex justify-content-end gap-1">
                      {/* Control Actions */}
                      {station.has_started ? (
                        <Button 
                          variant="light" size="sm" 
                          className="p-2 rounded-circle text-danger hover-bg-danger-soft border-0" 
                          title="Arrêter le flux"
                          onClick={() => stopMutation.mutate(station.short_name)}
                          loading={stopMutation.isPending}
                        >
                          <Square size={16} />
                        </Button>
                      ) : (
                        <Button 
                          variant="light" size="sm" 
                          className="p-2 rounded-circle text-success hover-bg-success-soft border-0" 
                          title="Démarrer le flux"
                          onClick={() => startMutation.mutate(station.short_name)}
                          loading={startMutation.isPending}
                        >
                          <Play size={16} />
                        </Button>
                      )}
                      
                      {/* Tools */}
                      <Button 
                        variant="light" size="sm" 
                        className="p-2 rounded-circle text-info hover-bg-info-soft border-0" 
                        title="Voir les Logs"
                        onClick={() => fetchLogs(station.short_name, station.name)}
                      >
                        <FileText size={16} />
                      </Button>
                      
                      <a href={`/station/${station.short_name}/settings`} className="btn btn-light-soft btn-sm p-2 rounded-circle border-0" title="Configuration">
                        <Settings size={16} className="text-muted-soft" />
                      </a>
                      <a href={`/station/${station.short_name}`} target="_blank" rel="noreferrer" className="btn btn-light-soft btn-sm p-2 rounded-circle border-0" title="Voir profil">
                        <ExternalLink size={16} className="text-muted-soft" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Logs Modal */}
      <Modal 
        isOpen={logModalOpen} 
        onClose={() => setLogModalOpen(false)} 
        title={`Logs Liquidsoap : ${logStationName}`}
        size="lg"
      >
        <div className="bg-dark text-success p-4 rounded-3 font-monospace small overflow-auto" style={{ maxHeight: '500px', whiteSpace: 'pre-wrap' }}>
          {activeLogs || 'Chargement des logs...'}
        </div>
        <div className="mt-4 d-flex justify-content-end">
          <Button variant="light" onClick={() => setLogModalOpen(false)}>Fermer</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStationList;
