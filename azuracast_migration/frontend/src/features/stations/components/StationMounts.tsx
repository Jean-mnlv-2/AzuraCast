import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Settings, 
  Trash2, 
  MoreVertical,
  Radio,
  ExternalLink,
  Shield,
  Volume2
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import MountEditModal from './MountEditModal';

interface Mount {
  id: number;
  name: string;
  display_name: string;
  is_default: boolean;
  is_public: boolean;
  autodj_bitrate: number;
  autodj_format: string;
}

const StationMounts: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMount, setSelectedMount] = useState<Mount | null>(null);
  
  const { data: mounts, isLoading } = useQuery<Mount[]>({
    queryKey: ['mounts', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/mounts/`);
      return response.data;
    },
  });

  const saveMountMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedMount) {
        return axios.patch(`/stations/${station_short_name}/mounts/${selectedMount.id}/`, data);
      } else {
        return axios.post(`/stations/${station_short_name}/mounts/`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mounts', station_short_name] });
      setIsModalOpen(false);
      setSelectedMount(null);
    },
  });

  const deleteMountMutation = useMutation({
    mutationFn: async (mountId: number) => {
      return axios.delete(`/stations/${station_short_name}/mounts/${mountId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mounts', station_short_name] });
    },
  });

  const handleEditClick = (mount: Mount) => {
    setSelectedMount(mount);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedMount(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (mountId: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce point de montage ?')) {
      deleteMountMutation.mutate(mountId);
    }
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
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">{t('mounts.title')}</h1>
          <p className="text-muted mb-0">{t('mounts.subtitle')}</p>
        </div>
        <Button 
          variant="danger" 
          icon={<Plus size={20} />} 
          onClick={handleCreateClick}
        >
          {t('mounts.new_mount')}
        </Button>
      </div>

      <div className="row g-4">
        {mounts?.map((mount) => (
          <div key={mount.id} className="col-12 col-lg-6">
            <Card 
              className={`h-100 ${mount.is_default ? 'border-start border-4 border-danger' : ''}`}
              headerActions={
                <div className="dropdown">
                  <button className="btn btn-link text-muted p-0 shadow-none" data-bs-toggle="dropdown">
                    <MoreVertical size={20} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                    <li>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2" 
                        onClick={() => handleEditClick(mount)}
                      >
                        <Settings size={16} /> {t('common.edit')}
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2 text-danger" 
                        onClick={() => handleDeleteClick(mount.id)}
                      >
                        <Trash2 size={16} /> {t('common.delete')}
                      </button>
                    </li>
                  </ul>
                </div>
              }
            >
              <div className="d-flex align-items-center gap-4">
                <div className="bg-light-soft rounded-3 p-3 text-danger">
                  <Volume2 size={32} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold">{mount.display_name}</h5>
                    {mount.is_default && <span className="badge bg-danger-soft text-danger small">{t('mounts.default')}</span>}
                  </div>
                  <p className="text-muted small mb-2 font-monospace">{mount.name}</p>
                  <div className="d-flex gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-1"><Radio size={14} /> {mount.autodj_bitrate}kbps {mount.autodj_format.toUpperCase()}</span>
                    {mount.is_public && <span className="d-flex align-items-center gap-1"><Shield size={14} /> {t('mounts.public')}</span>}
                  </div>
                </div>
                <Button variant="light" size="sm" icon={<ExternalLink size={16} />} />
              </div>
            </Card>
          </div>
        ))}
      </div>

      <MountEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => saveMountMutation.mutate(data)}
        mount={selectedMount}
        isLoading={saveMountMutation.isPending}
      />
    </div>
  );
};

export default StationMounts;
