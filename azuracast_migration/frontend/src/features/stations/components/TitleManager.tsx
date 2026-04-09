import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { 
  Search, 
  Music,
  Edit2,
  X,
  Check,
  Loader2,
  Type
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';

interface MediaFile {
  id: number;
  path: string;
  artist: string;
  title: string;
  album: string;
  length_text: string;
}

const TitleManager: React.FC = () => {
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '', album: '' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: media, isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media', station_short_name, 'all'],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/media/`);
      // Filtrer pour ne garder que les fichiers (pas les dossiers)
      return response.data.filter((f: any) => f.type !== 'directory');
    },
  });

  const updateMediaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return axios.patch(`/stations/${station_short_name}/media/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setEditingId(null);
    },
  });

  const handleStartEdit = (file: MediaFile) => {
    setEditingId(file.id);
    setEditForm({
      title: file.title || '',
      artist: file.artist || '',
      album: file.album || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: number) => {
    updateMediaMutation.mutate({ id, data: editForm });
  };

  const [bulkEditForm, setBulkEditForm] = useState({ artist: '', album: '' });
  const [isBulkEditing, setIsBulkEditing] = useState(false);

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const promises = selectedIds.map(id => 
        axios.patch(`/stations/${station_short_name}/media/${id}/`, data)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setSelectedIds([]);
      setIsBulkEditing(false);
      setBulkEditForm({ artist: '', album: '' });
    },
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMedia?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMedia?.map(m => m.id) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredMedia = media?.filter(file => 
    file.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    file.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Loader2 size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="bw-section p-0 overflow-hidden">
        <div className="p-4 border-bottom bg-light-soft d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div className="position-relative flex-grow-1 max-width-md">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50" size={18} />
              <input 
                type="text" 
                className="form-control ps-5 bg-surface border-0 shadow-none" 
                placeholder="Rechercher par titre, artiste ou chemin..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="animate-in fade-in slide-in-from-left-2 d-flex align-items-center gap-2 bg-primary-soft px-3 py-2 rounded-3 border border-primary border-opacity-10">
                <span className="text-primary fw-800 small">{selectedIds.length} sélectionnés</span>
                <div className="vr opacity-10 mx-1"></div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="py-1 px-3 fw-700"
                  onClick={() => setIsBulkEditing(true)}
                >
                  Action groupée
                </Button>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-muted-soft hover-text-danger"
                  onClick={() => setSelectedIds([])}
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted-soft small fw-600">{filteredMedia?.length || 0} fichiers trouvés</span>
          </div>
        </div>

        {isBulkEditing && (
          <div className="p-4 bg-primary-soft border-bottom animate-in fade-in slide-in-from-top-2">
            <h6 className="fw-800 text-main mb-3">Modification groupée ({selectedIds.length} fichiers)</h6>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label smaller fw-800 text-uppercase ls-1 text-muted-soft">Artiste commun</label>
                <input 
                  type="text" 
                  className="form-control bg-surface border-0 shadow-none"
                  placeholder="Laisser vide pour ne pas changer"
                  value={bulkEditForm.artist}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, artist: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label smaller fw-800 text-uppercase ls-1 text-muted-soft">Album commun</label>
                <input 
                  type="text" 
                  className="form-control bg-surface border-0 shadow-none"
                  placeholder="Laisser vide pour ne pas changer"
                  value={bulkEditForm.album}
                  onChange={(e) => setBulkEditForm({ ...bulkEditForm, album: e.target.value })}
                />
              </div>
              <div className="col-md-4 d-flex gap-2">
                <Button 
                  variant="primary" 
                  className="flex-grow-1 fw-700"
                  onClick={() => {
                    const data: any = {};
                    if (bulkEditForm.artist) data.artist = bulkEditForm.artist;
                    if (bulkEditForm.album) data.album = bulkEditForm.album;
                    bulkUpdateMutation.mutate(data);
                  }}
                  loading={bulkUpdateMutation.isPending}
                  disabled={!bulkEditForm.artist && !bulkEditForm.album}
                >
                  Appliquer aux {selectedIds.length} fichiers
                </Button>
                <Button variant="light" onClick={() => setIsBulkEditing(false)}>Annuler</Button>
              </div>
            </div>
          </div>
        )}

        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr className="bg-light-soft">
                <th className="ps-4" style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    className="form-check-input"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredMedia?.length}
                    ref={input => {
                      if (input) {
                        input.indeterminate = selectedIds.length > 0 && selectedIds.length < (filteredMedia?.length || 0);
                      }
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th style={{ width: '30%' }}>Titre</th>
                <th style={{ width: '25%' }}>Artiste</th>
                <th style={{ width: '20%' }}>Album</th>
                <th style={{ width: '15%' }}>Chemin / Info</th>
                <th className="pe-4 text-end" style={{ width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedia?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <Music size={48} className="text-muted-soft opacity-20 mb-3" />
                    <p className="text-muted-soft fw-600">Aucun média ne correspond à votre recherche</p>
                  </td>
                </tr>
              ) : (
                filteredMedia?.map((file) => (
                  <tr 
                    key={file.id} 
                    className={`hover-bg-light-soft transition-all border-bottom-0 ${selectedIds.includes(file.id) ? 'bg-primary-soft' : ''}`}
                  >
                    <td className="ps-4">
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedIds.includes(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </td>
                    <td>
                      {editingId === file.id ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm bg-surface border-primary"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(file.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => handleStartEdit(file)}>
                          <Music size={14} className="text-primary opacity-50" />
                          <span className="fw-700 text-main">{file.title || 'Sans titre'}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === file.id ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm bg-surface border-primary"
                          value={editForm.artist}
                          onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(file.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        <span className="text-muted-soft fw-600 small">{file.artist || 'Artiste inconnu'}</span>
                      )}
                    </td>
                    <td>
                      {editingId === file.id ? (
                        <input 
                          type="text" 
                          className="form-control form-control-sm bg-surface border-primary"
                          value={editForm.album}
                          onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(file.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        <span className="text-muted-soft smaller">{file.album || '-'}</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-muted-soft smaller text-truncate fw-500" style={{ maxWidth: '180px' }} title={file.path}>
                          {file.path}
                        </span>
                        <span className="badge bg-light-soft text-muted-soft smaller align-self-start mt-1">
                          {file.length_text}
                        </span>
                      </div>
                    </td>
                    <td className="pe-4 text-end">
                      {editingId === file.id ? (
                        <div className="d-flex justify-content-end gap-1">
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="p-1 px-2"
                            onClick={() => handleSaveEdit(file.id)}
                            loading={updateMediaMutation.isPending && editingId === file.id}
                          >
                            <Check size={16} />
                          </Button>
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="p-1 px-2"
                            onClick={handleCancelEdit}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="p-1 px-2 hover-bg-primary-soft hover-text-primary"
                          onClick={() => handleStartEdit(file)}
                        >
                          <Edit2 size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-primary-soft rounded-4 border border-primary border-opacity-10 d-flex align-items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-3">
          <Type size={20} />
        </div>
        <div>
          <h6 className="fw-800 text-main mb-1">Astuce d'édition</h6>
          <p className="text-muted-soft smaller mb-0 fw-600">
            Utilisez la recherche pour isoler un album ou un artiste spécifique et éditer les titres rapidement sans changer de page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TitleManager;
