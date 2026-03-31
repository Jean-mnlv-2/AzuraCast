import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Music, 
  Plus, 
  Minus, 
  Search, 
  ArrowLeft
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';

const PlaylistMedia: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name, playlist_id } = useParams<{ station_short_name: string, playlist_id: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 1. Fetch Playlist Details
  const { data: playlist, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ['playlist', station_short_name, playlist_id],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/playlists/${playlist_id}/`);
      return response.data;
    },
  });

  // 2. Fetch Media IN Playlist (with server-side search)
  const { data: currentMedia = [] } = useQuery<any[]>({
    queryKey: ['playlist-current-media', station_short_name, playlist_id, debouncedSearch],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/playlists/${playlist_id}/current-media/`, {
        params: { search: debouncedSearch }
      });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });

  // 3. Fetch Media ELIGIBLE for Playlist (with server-side search)
  const { data: availableMedia = [] } = useQuery<any[]>({
    queryKey: ['playlist-eligible-media', station_short_name, playlist_id, debouncedSearch],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/playlists/${playlist_id}/eligible-media/`, {
        params: { search: debouncedSearch }
      });
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });

  // 4. Mutation to add/remove media
  const manageMediaMutation = useMutation({
    mutationFn: async ({ mediaId, action }: { mediaId: number, action: 'add' | 'remove' }) => {
      return axios.post(`/stations/${station_short_name}/playlists/${playlist_id}/media/`, {
        media_id: mediaId,
        action: action
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-current-media'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-eligible-media'] });
    },
  });

  if (isPlaylistLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small text-uppercase fw-700 ls-1 mb-2">
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted-soft">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to={`/station/${station_short_name}`} className="text-decoration-none text-muted-soft">{station_short_name}</Link></li>
              <li className="breadcrumb-item"><Link to={`/station/${station_short_name}/playlists`} className="text-decoration-none text-muted-soft">Playlists</Link></li>
              <li className="breadcrumb-item text-primary active" aria-current="page">{playlist?.name}</li>
            </ol>
          </nav>
          <h1 className="fw-800 text-main mb-0">Gestion des Médias : {playlist?.name}</h1>
        </div>
        <Link to={`/station/${station_short_name}/playlists`}>
          <Button variant="light" icon={<ArrowLeft size={20} />}>
            Retour aux playlists
          </Button>
        </Link>
      </div>

      <div className="row g-4">
        {/* Left: Current Media in Playlist */}
        <div className="col-lg-6">
          <div className="bw-section p-0 overflow-hidden">
            <div className="p-4 border-bottom bg-light-soft">
              <h5 className="fw-800 text-main mb-0 d-flex align-items-center gap-2">
                <Music size={20} className="text-primary" />
                Médias dans la playlist ({currentMedia.length})
              </h5>
            </div>
            <div className="table-responsive" style={{ maxHeight: '600px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light-soft">
                  <tr>
                    <th className="ps-4 py-3 smaller fw-700 text-uppercase ls-1">Titre / Artiste</th>
                    <th className="text-end pe-4 py-3 smaller fw-700 text-uppercase ls-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMedia.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-5 text-muted-soft">
                        Aucun média dans cette playlist.
                      </td>
                    </tr>
                  ) : (
                    currentMedia.map((media) => (
                      <tr key={media.id}>
                        <td className="ps-4">
                          <p className="fw-700 text-main mb-0">{media.title || media.path_short.split('/').pop()}</p>
                          <span className="text-muted-soft smaller fw-600">{media.artist || 'Artiste inconnu'}</span>
                        </td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="text-danger"
                            icon={<Minus size={16} />} 
                            onClick={() => manageMediaMutation.mutate({ mediaId: media.id, action: 'remove' })}
                            loading={manageMediaMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Available Media */}
        <div className="col-lg-6">
          <div className="bw-section p-0 overflow-hidden">
            <div className="p-4 border-bottom bg-light-soft">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-800 text-main mb-0">Médias disponibles</h5>
              </div>
              <div className="position-relative">
                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50" size={18} />
                <input 
                  type="text" 
                  className="form-control ps-5 bg-surface border-0 shadow-none" 
                  placeholder="Rechercher des médias..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: '600px' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light-soft">
                  <tr>
                    <th className="ps-4 py-3 smaller fw-700 text-uppercase ls-1">Titre / Artiste</th>
                    <th className="text-end pe-4 py-3 smaller fw-700 text-uppercase ls-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {availableMedia.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-5 text-muted-soft">
                        Aucun média disponible correspondant à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    availableMedia.map((media) => (
                      <tr key={media.id}>
                        <td className="ps-4">
                          <p className="fw-700 text-main mb-0">{media.title || media.path_short.split('/').pop()}</p>
                          <span className="text-muted-soft smaller fw-600">{media.artist || 'Artiste inconnu'}</span>
                        </td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="text-success"
                            icon={<Plus size={16} />} 
                            onClick={() => manageMediaMutation.mutate({ mediaId: media.id, action: 'add' })}
                            loading={manageMediaMutation.isPending}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistMedia;
