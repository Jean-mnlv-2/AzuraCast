import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { Rss, Plus, ChevronRight, Copy, Check } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';

interface Podcast {
  id: number;
  title: string;
  description: string;
  language: string;
  author: string;
  is_published: boolean;
  art?: string;
  art_external_url?: string;
  episodes: { id: number }[];
}

const StationPodcasts: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyRssUrl = (podcastId: number) => {
    const url = `${window.location.origin}/api/podcasts/${podcastId}/feed/`;
    navigator.clipboard.writeText(url);
    setCopiedId(podcastId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: station } = useQuery({
    queryKey: ['station', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/`);
      return response.data;
    },
  });

  const { data: podcasts, isLoading } = useQuery<Podcast[]>({
    queryKey: ['podcasts', station?.id],
    queryFn: async () => {
      const response = await api.get(`/podcasts/?station_id=${station?.id}`);
      return response.data;
    },
    enabled: !!station?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!station?.id) {
        throw new Error('Station manquante');
      }
      return api.post('/podcasts/', {
        station: station.id,
        title,
        description,
        language: 'fr',
        is_published: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts', station?.id] });
      setModalOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  const handlePodcastClick = (podcastId: number) => {
    navigate(`/station/${station_short_name}/podcasts/${podcastId}`);
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
          <h1 className="fw-800 text-main mb-1">{t('podcasts.title')}</h1>
          <p className="text-muted small mb-0">{station?.name}</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} className="shadow-sm" onClick={() => setModalOpen(true)} disabled={!station?.id}>
          {t('podcasts.new')}
        </Button>
      </div>

      <div className="row g-4">
        {podcasts?.map((podcast) => (
          <div key={podcast.id} className="col-md-6 col-lg-4">
            <div className="bw-section h-100 d-flex flex-column p-0 overflow-hidden">
              <div className="ratio ratio-16x9 bg-light-soft border-bottom">
                {podcast.art_external_url || podcast.art ? (
                  <img 
                    src={podcast.art_external_url || (podcast.art?.startsWith('http') ? podcast.art : `${import.meta.env.VITE_API_URL}${podcast.art}`)} 
                    alt={podcast.title} 
                    className="object-fit-cover"
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center">
                    <Rss size={48} className="text-muted-soft opacity-20" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow-1 d-flex flex-column">
                <div className="mb-3">
                  <h5 className="fw-bold text-main mb-1">{podcast.title}</h5>
                  <p className="small text-muted mb-2 text-truncate-2">{podcast.description}</p>
                </div>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div className="small text-muted-soft fw-600">
                    {t('podcasts.episodes_count', { count: podcast.episodes?.length || 0 })}
                  </div>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="light" 
                      size="sm" 
                      className="p-2 rounded-circle shadow-none border-0"
                      title={t('podcasts.copy_rss')}
                      onClick={() => copyRssUrl(podcast.id)}
                    >
                      {copiedId === podcast.id ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm" 
                      className="p-2 rounded-circle shadow-none border-0"
                      onClick={() => handlePodcastClick(podcast.id)}
                    >
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('podcasts.modal.title')}
        footer={
          <>
            <Button variant="light" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" loading={createMutation.isPending} disabled={!title.trim()} onClick={() => createMutation.mutate()}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <Input label={t('podcasts.modal.name')} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea label={t('podcasts.modal.description')} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </Modal>
    </div>
  );
};

export default StationPodcasts;
