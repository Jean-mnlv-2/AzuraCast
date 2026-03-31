import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { Users, UserPlus, Settings, Trash2, Mic2, ChevronLeft } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import BroadcastingSoftwareList from './BroadcastingSoftwareList';

interface Streamer {
  id: number;
  streamer_username: string;
  display_name: string | null;
  is_active: boolean;
}

const StationStreamers: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStreamer, setSelectedStreamer] = useState<Streamer | null>(null);

  const { data: streamers, isLoading } = useQuery<Streamer[]>({
    queryKey: ['streamers', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/streamers/`);
      return response.data;
    },
  });

  const createStreamerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedStreamer) {
        return api.patch(`/stations/${station_short_name}/streamers/${selectedStreamer.id}/`, data);
      }
      return api.post(`/stations/${station_short_name}/streamers/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamers', station_short_name] });
      setIsModalOpen(false);
      setSelectedStreamer(null);
    },
  });

  const deleteStreamerMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/stations/${station_short_name}/streamers/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamers', station_short_name] });
    },
  });

  const handleEditClick = (streamer: Streamer) => {
    setSelectedStreamer(streamer);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    createStreamerMutation.mutate(data);
  };

  const toggleStreamerMutation = useMutation({
    mutationFn: async (streamer: Streamer) => {
      return api.patch(`/stations/${station_short_name}/streamers/${streamer.id}/`, {
        is_active: !streamer.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamers', station_short_name] });
    },
  });

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted small">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <Link to={`/station/${station_short_name}`} className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-2">
            <ChevronLeft size={16} /> {t('station_settings.back_to_profile')}
          </Link>
          <h1 className="fw-800 text-main mb-1">{t('streamers.title')}</h1>
          <p className="text-muted small mb-0">{station_short_name}</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          icon={<UserPlus size={18} />}
          className="shadow-sm"
        >
          {t('streamers.new')}
        </Button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="bw-section bg-primary-soft border-0 p-4 mb-4 d-flex align-items-center">
            <div className="bg-primary p-3 rounded-4 text-white me-4 shadow-sm">
              <Mic2 size={24} />
            </div>
            <div>
              <h5 className="fw-bold mb-1 text-primary">{t('streamers.harbor_title')}</h5>
              <p className="text-muted small mb-0" dangerouslySetInnerHTML={{ __html: t('streamers.harbor_desc') }}></p>
            </div>
          </div>

          <div className="bw-section p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th className="ps-4">{t('streamers.table.user')}</th>
                    <th className="text-center">{t('streamers.table.status')}</th>
                    <th className="text-end pe-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {streamers?.map((streamer) => (
                    <tr key={streamer.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-info-soft text-info p-2 rounded-circle">
                              <Mic2 size={20} />
                            </div>
                            <div>
                              <h6 className="fw-700 text-main mb-0">{streamer.display_name || streamer.streamer_username}</h6>
                              <span className="smaller text-muted-soft fw-600">@{streamer.streamer_username}</span>
                            </div>
                          </div>
                        </td>
                      <td className="py-3 text-center">
                        <div className="form-check form-switch d-flex justify-content-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={streamer.is_active}
                            onChange={() => toggleStreamerMutation.mutate(streamer)}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="p-2"
                            onClick={() => handleEditClick(streamer)}
                            icon={<Settings size={16} className="text-muted" />}
                          />
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="p-2 hover-bg-danger-light"
                            onClick={() => {
                              if (window.confirm(t('streamers.delete_confirm'))) {
                                deleteStreamerMutation.mutate(streamer.id);
                              }
                            }}
                            icon={<Trash2 size={16} className="text-danger" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {streamers?.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5">
                        <div className="py-5">
                          <Users size={48} className="text-muted opacity-25 mb-3" />
                          <h5 className="text-muted fw-bold">{t('streamers.no_data')}</h5>
                          <p className="text-muted small">{t('streamers.no_data_desc')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <BroadcastingSoftwareList />
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedStreamer(null); }} 
        title={selectedStreamer ? t('streamers.edit') : t('streamers.new')}
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <Input 
                name="streamer_username" 
                label={t('streamers.modal.user')} 
                placeholder="ex: dj_bantu" 
                defaultValue={selectedStreamer?.streamer_username}
                required 
                disabled={!!selectedStreamer}
              />
            </div>
            <div className="col-12">
              <Input 
                name="streamer_password" 
                type="password" 
                label={selectedStreamer ? t('streamers.modal.pass_change') : t('streamers.modal.pass')} 
                required={!selectedStreamer} 
              />
            </div>
            <div className="col-12">
              <Input 
                name="display_name" 
                label={t('streamers.modal.display_name')} 
                placeholder="ex: DJ Bantu" 
                defaultValue={selectedStreamer?.display_name || ''}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => { setIsModalOpen(false); setSelectedStreamer(null); }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={createStreamerMutation.isPending}>
              {selectedStreamer ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationStreamers;
