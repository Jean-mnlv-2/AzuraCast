import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import { Plus, ChevronLeft, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface Episode {
  id: number;
  title: string;
  publish_at: string | null;
  is_published: boolean;
}

interface Podcast {
  id: number;
  title: string;
  description: string;
  episodes: Episode[];
}

const PodcastDetails: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name, podcast_id } = useParams<{ station_short_name: string; podcast_id: string }>();
  const queryClient = useQueryClient();
  const [episodeModal, setEpisodeModal] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [publishAt, setPublishAt] = useState('');

  const { data: podcast, isLoading } = useQuery<Podcast>({
    queryKey: ['podcast', podcast_id],
    queryFn: async () => {
      const response = await api.get(`/podcasts/${podcast_id}/`);
      return response.data;
    },
  });

  const createEpisode = useMutation({
    mutationFn: async () => {
      return api.post('/podcasts/episodes/', {
        podcast: Number(podcast_id),
        title: epTitle,
        publish_at: publishAt ? new Date(publishAt).toISOString() : null,
        is_published: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcast_id] });
      setEpisodeModal(false);
      setEpTitle('');
      setPublishAt('');
    },
  });

  const deleteEpisode = useMutation({
    mutationFn: (id: number) => api.delete(`/podcasts/episodes/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['podcast', podcast_id] }),
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
          <Link to={`/station/${station_short_name}/podcasts`} className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-2">
            <ChevronLeft size={16} /> Retour aux podcasts
          </Link>
          <h1 className="fw-800 text-main mb-1">{podcast?.title}</h1>
          <p className="text-muted small mb-0">{podcast?.description}</p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} className="shadow-sm" onClick={() => setEpisodeModal(true)}>
          Nouvel Épisode
        </Button>
      </div>

      <div className="bw-section p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th className="ps-4">Titre de l&apos;épisode</th>
                <th>Date de publication</th>
                <th>Statut</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {podcast?.episodes.map((episode) => (
                <tr key={episode.id}>
                  <td className="ps-4 fw-bold text-main">{episode.title}</td>
                  <td>{episode.publish_at ? new Date(episode.publish_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`badge ${episode.is_published ? 'bg-success' : 'bg-secondary'}`}>
                      {episode.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <Button
                      variant="light"
                      size="sm"
                      className="text-danger"
                      icon={<Trash2 size={16} />}
                      onClick={() => {
                        if (window.confirm('Supprimer cet épisode ?')) {
                          deleteEpisode.mutate(episode.id);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={episodeModal}
        onClose={() => setEpisodeModal(false)}
        title="Nouvel épisode"
        footer={
          <>
            <Button variant="light" onClick={() => setEpisodeModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" loading={createEpisode.isPending} disabled={!epTitle.trim()} onClick={() => createEpisode.mutate()}>
              {t('common.create')}
            </Button>
          </>
        }
      >
        <Input label="Titre" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} required />
        <div className="mb-3">
          <label className="form-label small fw-bold text-muted text-uppercase">Publication</label>
          <input type="datetime-local" className="form-control" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};

export default PodcastDetails;
