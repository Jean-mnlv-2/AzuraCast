import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { ListMusic, Plus, Settings2, Trash2, Shuffle, Repeat, Calendar, Music } from 'lucide-react';
import PlaylistEditModal from './PlaylistEditModal';
import VisualScheduler from './VisualScheduler';
import Button from '../../../components/ui/Button';

interface ScheduleItem {
  id: number;
  start_time: number;
  end_time: number;
  days: string;
}

interface Playlist {
  id: number;
  name: string;
  type: string;
  is_enabled: boolean;
  playback_order: string;
  weight: number;
  source: string;
  schedule_items: ScheduleItem[];
}

const StationPlaylists: React.FC = () => {
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ['playlists', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/playlists/`);
      return response.data;
    },
  });

  const savePlaylistMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedPlaylist) {
        return api.patch(`/stations/${station_short_name}/playlists/${selectedPlaylist.id}/`, data);
      } else {
        return api.post(`/stations/${station_short_name}/playlists/`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', station_short_name] });
      setIsEditModalOpen(false);
      setSelectedPlaylist(null);
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: number) => {
      return api.delete(`/stations/${station_short_name}/playlists/${playlistId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists', station_short_name] });
    },
  });

  const handleEditClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsEditModalOpen(true);
  };

  const handleSaveSchedule = (playlistId: number, schedules: ScheduleItem[]) => {
    const playlist = playlists?.find(p => p.id === playlistId);
    if (playlist) {
      savePlaylistMutation.mutate({ 
        ...playlist,
        schedule_items: schedules 
      });
    }
  };

  const handleCreateClick = () => {
    setSelectedPlaylist(null);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (playlistId: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette playlist ?')) {
      deletePlaylistMutation.mutate(playlistId);
    }
  };

  const getOrderIcon = (order: string) => {
    switch (order) {
      case 'random': return <Shuffle size={14} className="me-1" />;
      case 'sequential': return <Repeat size={14} className="me-1" />;
      case 'shuffle': return <Shuffle size={14} className="me-1" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted">Chargement des programmations BantuWave...</p>
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
              <li className="breadcrumb-item text-primary active" aria-current="page">Playlists</li>
            </ol>
          </nav>
          <h1 className="fw-800 text-main mb-0">Listes de Lecture</h1>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant={viewMode === 'list' ? 'primary' : 'light'} 
            size="sm" 
            onClick={() => setViewMode('list')}
            icon={<ListMusic size={18} />}
          >
            Liste
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'primary' : 'light'} 
            size="sm" 
            onClick={() => setViewMode('calendar')}
            icon={<Calendar size={18} />}
          >
            Calendrier
          </Button>
          <div className="vr mx-2 opacity-10"></div>
          <Button variant="danger" pill icon={<Plus size={20} />} onClick={handleCreateClick}>
            Nouvelle Playlist
          </Button>
        </div>
      </div>

      <div className="bw-section p-0 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th className="ps-4">Playlist</th>
                  <th>Type</th>
                  <th>Ordre</th>
                  <th>Poids</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      <span className="text-muted-soft">Chargement des playlists...</span>
                    </td>
                  </tr>
                ) : playlists?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <ListMusic size={48} className="text-muted-soft opacity-20 mb-3" />
                      <p className="text-muted-soft fw-600">Aucune playlist configurée</p>
                    </td>
                  </tr>
                ) : (
                  playlists?.map((playlist) => (
                    <tr key={playlist.id} className="hover-bg-light-soft transition-all">
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary-soft text-primary p-2 rounded-3">
                            <ListMusic size={20} />
                          </div>
                          <div>
                            <h6 className="fw-700 text-main mb-0">{playlist.name}</h6>
                            <span className="smaller text-muted-soft fw-600 text-uppercase ls-1">
                              {playlist.type} • {playlist.source === 'songs' ? 'Fichiers' : 'Remote'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light-soft text-main border border-white-soft px-3 py-2 fw-600">
                          {playlist.type}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2 text-muted-soft fw-600 small">
                          {getOrderIcon(playlist.playback_order)}
                          {playlist.playback_order}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1 bg-light-soft" style={{ height: '4px', minWidth: '60px' }}>
                            <div className="progress-bar bg-primary" style={{ width: `${(playlist.weight / 5) * 100}%` }}></div>
                          </div>
                          <span className="small fw-700 text-main">{playlist.weight}</span>
                        </div>
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Link to={`/station/${station_short_name}/playlists/${playlist.id}/media`}>
                            <Button variant="light" size="sm" icon={<Music size={16} />} title="Gérer les médias" />
                          </Link>
                          <Button variant="light" size="sm" icon={<Settings2 size={16} />} onClick={() => handleEditClick(playlist)} />
                          <Button variant="light" size="sm" className="hover-text-danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteClick(playlist.id)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <VisualScheduler 
            playlists={playlists || []} 
            onEdit={handleEditClick} 
            onSaveSchedule={handleSaveSchedule}
          />
        )}
      </div>

      <PlaylistEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(data) => savePlaylistMutation.mutate(data)}
        playlist={selectedPlaylist}
        isLoading={savePlaylistMutation.isPending}
      />
    </div>
  );
};

export default StationPlaylists;
