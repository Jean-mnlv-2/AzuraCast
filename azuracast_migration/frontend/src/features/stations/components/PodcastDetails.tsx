import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import { Plus, ChevronLeft, Trash2, Music, Rss, Copy, Check, ExternalLink } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface Episode {
  id: number;
  title: string;
  publish_at: string | null;
  is_published: boolean;
  media?: {
    path: string;
    length_text: string;
  };
}

interface Podcast {
  id: number;
  title: string;
  description: string;
  author: string;
  language: string;
  episodes: Episode[];
}

const PodcastDetails: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name, podcast_id } = useParams<{ station_short_name: string; podcast_id: string }>();
  const queryClient = useQueryClient();
  
  const [episodeModal, setEpisodeModal] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  
  const [epTitle, setEpTitle] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [copied, setCopied] = useState(false);

  const rssUrl = `${window.location.origin}/api/podcasts/${podcast_id}/feed/`;

  const copyRss = () => {
    navigator.clipboard.writeText(rssUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { data: podcast, isLoading } = useQuery<Podcast>({
    queryKey: ['podcast', podcast_id],
    queryFn: async () => {
      const response = await api.get(`/podcasts/${podcast_id}/`);
      return response.data;
    },
  });

  const { data: stationMedia } = useQuery<any[]>({
    queryKey: ['media', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/media/`);
      return response.data.filter((m: any) => m.type !== 'directory');
    },
  });

  const createEpisode = useMutation({
    mutationFn: async () => {
      return api.post('/podcasts/episodes/', {
        podcast: Number(podcast_id),
        title: epTitle,
        publish_at: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
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

  const attachMedia = useMutation({
    mutationFn: async (mediaId: number) => {
      return api.post(`/podcasts/episodes/${selectedEpisodeId}/media/`, { media_id: mediaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast', podcast_id] });
      setMediaModal(false);
      setSelectedEpisodeId(null);
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-5 gap-4">
        <div className="flex-grow-1">
          <Link to={`/station/${station_short_name}/podcasts`} className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-3 hover-text-primary transition-all">
            <ChevronLeft size={16} /> Retour aux podcasts
          </Link>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-primary-soft text-primary p-2 rounded-3">
              <Rss size={24} />
            </div>
            <h1 className="fw-800 text-main mb-0">{podcast?.title}</h1>
          </div>
          <p className="text-muted mb-3 max-width-md">{podcast?.description}</p>
          
          <div className="d-inline-flex align-items-center gap-2 bg-light-soft px-3 py-2 rounded-pill border border-white">
            <span className="small text-muted fw-600">Flux RSS :</span>
            <code className="small text-primary fw-bold text-truncate" style={{ maxWidth: '200px' }}>{rssUrl}</code>
            <button onClick={copyRss} className="btn btn-link p-0 text-muted hover-text-primary">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
            <a href={rssUrl} target="_blank" rel="noreferrer" className="text-muted hover-text-primary">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        
        <div className="d-flex gap-2">
          <Button variant="primary" icon={<Plus size={18} />} className="shadow-sm px-4" onClick={() => setEpisodeModal(true)}>
            Nouvel Épisode
          </Button>
        </div>
      </div>

      <div className="bw-section p-0 overflow-hidden shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light-soft">
              <tr>
                <th className="ps-4 py-3 border-0 small text-uppercase fw-700 text-muted ls-1">Épisode</th>
                <th className="py-3 border-0 small text-uppercase fw-700 text-muted ls-1">Média</th>
                <th className="py-3 border-0 small text-uppercase fw-700 text-muted ls-1">Publication</th>
                <th className="py-3 border-0 small text-uppercase fw-700 text-muted ls-1">Statut</th>
                <th className="text-end pe-4 py-3 border-0 small text-uppercase fw-700 text-muted ls-1">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {podcast?.episodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted small fw-600">
                    Aucun épisode pour le moment.
                  </td>
                </tr>
              ) : (
                podcast?.episodes.map((episode) => (
                  <tr key={episode.id}>
                    <td className="ps-4">
                      <p className="fw-700 text-main mb-0">{episode.title}</p>
                      <span className="smaller text-muted">ID: {episode.id}</span>
                    </td>
                    <td>
                      {episode.media ? (
                        <div className="d-flex align-items-center gap-2">
                          <Music size={14} className="text-primary" />
                          <span className="small fw-600 text-main text-truncate" style={{ maxWidth: '150px' }}>{episode.media.path.split('/').pop()}</span>
                          <span className="badge bg-light-soft text-muted smaller">{episode.media.length_text}</span>
                        </div>
                      ) : (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 text-primary small fw-700 text-decoration-none"
                          onClick={() => {
                            setSelectedEpisodeId(episode.id);
                            setMediaModal(true);
                          }}
                        >
                          + Associer un média
                        </Button>
                      )}
                    </td>
                    <td className="small text-muted fw-600">
                      {episode.publish_at ? new Date(episode.publish_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      {new Date(episode.publish_at || '') > new Date() ? (
                        <span className="badge bg-info-soft text-info fw-700 smaller px-2">Programmé</span>
                      ) : (
                        <span className={`badge ${episode.is_published ? 'bg-success-soft text-success' : 'bg-secondary-soft text-muted'} fw-700 smaller px-2`}>
                          {episode.is_published ? 'Publié' : 'Brouillon'}
                        </span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          variant="light"
                          size="sm"
                          className="p-2 rounded-circle hover-bg-danger-soft hover-text-danger transition-all border-0"
                          icon={<Trash2 size={16} />}
                          onClick={() => {
                            if (window.confirm('Supprimer cet épisode ?')) {
                              deleteEpisode.mutate(episode.id);
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouvel Épisode */}
      <Modal
        isOpen={episodeModal}
        onClose={() => setEpisodeModal(false)}
        title="Nouvel épisode"
        footer={
          <div className="d-flex gap-2 w-100 justify-content-end">
            <Button variant="light" onClick={() => setEpisodeModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" className="px-4" loading={createEpisode.isPending} disabled={!epTitle.trim()} onClick={() => createEpisode.mutate()}>
              {t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="p-1">
          <Input label="Titre de l'épisode" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} placeholder="ex: Épisode 01 - Le début" required />
          <div className="mb-0">
            <label className="form-label small fw-bold text-muted text-uppercase mb-2">Date et heure de publication</label>
            <input 
              type="datetime-local" 
              className="form-control bg-light-soft border-0 py-2" 
              value={publishAt} 
              onChange={(e) => setPublishAt(e.target.value)} 
            />
            <p className="smaller text-muted mt-2">Laissez vide pour publier immédiatement.</p>
          </div>
        </div>
      </Modal>

      {/* Modal Sélection Média */}
      <Modal
        isOpen={mediaModal}
        onClose={() => setMediaModal(false)}
        title="Choisir un fichier média"
        size="lg"
      >
        <div className="p-1">
          <p className="small text-muted mb-4">Sélectionnez un fichier audio parmi les médias de la station.</p>
          <div className="list-group list-group-flush border rounded-3 overflow-hidden" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {stationMedia?.length === 0 ? (
              <div className="list-group-item text-center py-4 text-muted small">
                Aucun média trouvé dans la bibliothèque.
              </div>
            ) : (
              stationMedia?.map((m) => (
                <button
                  key={m.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-bottom-0"
                  onClick={() => attachMedia.mutate(m.id)}
                  disabled={attachMedia.isPending}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary-soft text-primary p-2 rounded-circle">
                      <Music size={16} />
                    </div>
                    <div className="text-start">
                      <p className="mb-0 fw-700 text-main small">{m.title || m.path.split('/').pop()}</p>
                      <span className="smaller text-muted">{m.path}</span>
                    </div>
                  </div>
                  <span className="badge bg-light-soft text-muted fw-700 small">{m.length_text}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PodcastDetails;
