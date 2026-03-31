import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { Bell, Plus, Settings, Trash2, Zap, MessageSquare, Send, ChevronLeft } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface Webhook {
  id: number;
  name: string;
  type: string;
  is_enabled: boolean;
  triggers: string[];
}

const StationWebhooks: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    queryKey: ['webhooks', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/webhooks/${station_short_name}/webhooks/`);
      return response.data;
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedWebhook) {
        return api.patch(`/webhooks/${station_short_name}/webhooks/${selectedWebhook.id}/`, data);
      }
      return api.post(`/webhooks/${station_short_name}/webhooks/`, {
        ...data,
        triggers: ['song_changed', 'listener_lost', 'listener_gained'] // Default triggers
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', station_short_name] });
      setIsModalOpen(false);
      setSelectedWebhook(null);
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/webhooks/${station_short_name}/webhooks/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', station_short_name] });
    },
  });

  const handleEditClick = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    createWebhookMutation.mutate(data);
  };

  const toggleWebhookMutation = useMutation({
    mutationFn: async (webhook: Webhook) => {
      return api.patch(`/webhooks/${station_short_name}/webhooks/${webhook.id}/`, {
        is_enabled: !webhook.is_enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', station_short_name] });
    },
  });

  const getWebhookIcon = (type: string) => {
    switch (type) {
      case 'discord': return <MessageSquare size={18} className="text-primary" />;
      case 'telegram': return <Send size={18} className="text-info" />;
      case 'email': return <Bell size={18} className="text-danger" />;
      case 'mastodon': return <Zap size={18} className="text-purple" />;
      case 'bluesky': return <Zap size={18} className="text-info" />;
      case 'tunein': return <Zap size={18} className="text-success" />;
      default: return <Zap size={18} className="text-warning" />;
    }
  };

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
          <h1 className="fw-800 text-main mb-1">{t('webhooks.title')}</h1>
          <p className="text-muted small mb-0">{station_short_name}</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={18} />}
          className="shadow-sm"
        >
          {t('webhooks.new')}
        </Button>
      </div>

      <div className="bw-section p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th className="ps-4">{t('webhooks.table.service')}</th>
                <th>{t('webhooks.table.triggers')}</th>
                <th>{t('webhooks.table.status')}</th>
                <th className="text-end pe-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {webhooks?.map((webhook) => (
                <tr key={webhook.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light-soft p-2 rounded-3">
                        {getWebhookIcon(webhook.type)}
                      </div>
                      <div>
                        <h6 className="fw-700 text-main mb-0">{webhook.name}</h6>
                        <span className="smaller text-muted-soft fw-600 text-uppercase ls-1">{webhook.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="d-flex flex-wrap gap-1">
                      {webhook.triggers?.map((trigger, idx) => (
                        <span key={idx} className="badge bg-light-soft text-muted border-0 rounded-pill px-3 py-1 small fw-medium">
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <div className="form-check form-switch d-flex justify-content-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={webhook.is_enabled}
                        onChange={() => toggleWebhookMutation.mutate(webhook)}
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
                        onClick={() => handleEditClick(webhook)}
                        icon={<Settings size={16} className="text-muted" />}
                      />
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="p-2 hover-bg-danger-light"
                        onClick={() => {
                          if (window.confirm(t('webhooks.delete_confirm'))) {
                            deleteWebhookMutation.mutate(webhook.id);
                          }
                        }}
                        icon={<Trash2 size={16} className="text-danger" />}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {webhooks?.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-5">
                    <div className="py-5">
                      <Bell size={48} className="text-muted opacity-25 mb-3" />
                      <h5 className="text-muted fw-bold">{t('webhooks.no_data')}</h5>
                      <p className="text-muted small">{t('webhooks.no_data_desc')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedWebhook(null); }} 
        title={selectedWebhook ? t('webhooks.edit') : t('webhooks.new')}
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <Input 
                name="name" 
                label={t('webhooks.modal.name')} 
                placeholder="ex: Mon Discord" 
                defaultValue={selectedWebhook?.name} 
                required 
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold small text-muted text-uppercase ls-1">
                {t('webhooks.modal.type')}
              </label>
              <select 
                name="type" 
                className="form-select" 
                defaultValue={selectedWebhook?.type || 'discord'} 
                required
              >
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
                <option value="generic">URL Générique (POST)</option>
              </select>
            </div>
            <div className="col-12">
              <Input 
                name="url" 
                label={t('webhooks.modal.url')} 
                placeholder="https://..." 
                defaultValue={(selectedWebhook as any)?.url || ''} 
                required 
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => { setIsModalOpen(false); setSelectedWebhook(null); }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={createWebhookMutation.isPending}>
              {selectedWebhook ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationWebhooks;
