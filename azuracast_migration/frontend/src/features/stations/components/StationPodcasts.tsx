import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import { Rss, Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface Podcast {
  id: number;
  title: string;
  description: string;
  language: string;
  author: string;
  is_published: boolean;
  episodes: { id: number }[];
}

const StationPodcasts: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
      const response = await api.get(`/podcasts/?station_id=${station.id}`);
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
          <h1 className="fw-800 text-main mb-1">Podcasts</h1>
          <p className="text-muted small mb-0">{station?.name}</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} className="shadow-sm" onClick={() => setModalOpen(true)} disabled={!station?.id}>
          Nouveau Podcast
        </Button>
      </div>

      <div className="row g-4">
        {podcasts?.map((podcast) => (
          <div key={podcast.id} className="col-md-6 col-lg-4">
            <div className="bw-section h-100 d-flex flex-column">
              <div className="mb-3">
                <h5 className="fw-bold text-main mb-1">{podcast.title}</h5>
                <p className="small text-muted mb-2">{podcast.description}</p>
              </div>
              <div className="mt-auto d-flex justify-content-between align-items-center">
                <span className={`badge ${podcast.is_published ? 'bg-success' : 'bg-secondary'}`}>
                  {podcast.is_published ? 'Publié' : 'Brouillon'}
                </span>
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">{podcast.episodes?.length ?? 0} épisodes</span>
                  <Link to={`/station/${station_short_name}/podcasts/${podcast.id}`} className="text-primary">
                    <Rss size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau podcast"
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
        <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Modal>
    </div>
  );
};

export default StationPodcasts;
