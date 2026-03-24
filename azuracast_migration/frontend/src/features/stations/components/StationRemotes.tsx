import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Settings, 
  Trash2, 
  MoreVertical,
  Globe,
  Link,
  Zap
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import RemoteEditModal from './RemoteEditModal';

interface Remote {
  id: number;
  display_name: string;
  type: string;
  url: string;
  mount: string;
  enable_autodj: boolean;
}

const StationRemotes: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  
  const { data: remotes, isLoading } = useQuery<Remote[]>({
    queryKey: ['remotes', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/remotes/`);
      return response.data;
    },
  });

  const saveRemoteMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedRemote) {
        return axios.patch(`/stations/${station_short_name}/remotes/${selectedRemote.id}/`, data);
      } else {
        return axios.post(`/stations/${station_short_name}/remotes/`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remotes', station_short_name] });
      setIsModalOpen(false);
      setSelectedRemote(null);
    },
  });

  const deleteRemoteMutation = useMutation({
    mutationFn: async (remoteId: number) => {
      return axios.delete(`/stations/${station_short_name}/remotes/${remoteId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remotes', station_short_name] });
    },
  });

  const handleEditClick = (remote: Remote) => {
    setSelectedRemote(remote);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedRemote(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (remoteId: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce flux distant ?')) {
      deleteRemoteMutation.mutate(remoteId);
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
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">{t('remotes.title')}</h1>
          <p className="text-muted mb-0">{t('remotes.subtitle')}</p>
        </div>
        <Button 
          variant="danger" 
          icon={<Plus size={20} />} 
          onClick={handleCreateClick}
        >
          {t('remotes.new_remote')}
        </Button>
      </div>

      <div className="row g-4">
        {remotes?.map((remote) => (
          <div key={remote.id} className="col-12 col-lg-6">
            <Card 
              className="h-100"
              headerActions={
                <div className="dropdown">
                  <button className="btn btn-link text-muted p-0 shadow-none" data-bs-toggle="dropdown">
                    <MoreVertical size={20} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                    <li>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2" 
                        onClick={() => handleEditClick(remote)}
                      >
                        <Settings size={16} /> {t('common.edit')}
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2 text-danger" 
                        onClick={() => handleDeleteClick(remote.id)}
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
                  <Globe size={32} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold">{remote.display_name}</h5>
                    <span className="badge bg-light text-muted border small">{remote.type.toUpperCase()}</span>
                  </div>
                  <p className="text-muted small mb-2 d-flex align-items-center gap-1"><Link size={14} /> {remote.url}{remote.mount}</p>
                  <div className="d-flex gap-3 small text-muted">
                    {remote.enable_autodj && <span className="d-flex align-items-center gap-1 text-success"><Zap size={14} /> {t('remotes.autodj_enabled')}</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <RemoteEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => saveRemoteMutation.mutate(data)}
        remote={selectedRemote}
        isLoading={saveRemoteMutation.isPending}
      />
    </div>
  );
};

export default StationRemotes;
