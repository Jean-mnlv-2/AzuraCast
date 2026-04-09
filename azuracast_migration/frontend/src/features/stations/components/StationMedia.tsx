import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { 
  Search, 
  FileAudio,
  Trash2,
  Edit2,
  FolderPlus,
  CheckSquare,
  Upload,
  Music,
  Folder,
  ChevronRight,
  FileText,
  ArrowLeft,
  Type
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import MediaEditModal from './MediaEditModal';
import MediaImportModal from './MediaImportModal';
import TitleManager from './TitleManager';

interface MediaFile {
  id: number;
  path_short: string;
  path: string;
  artist: string;
  title: string;
  album: string;
  length_text: string;
  bitrate: number;
  type?: 'directory' | 'file';
  name?: string;
  playlists?: number[];
  genre?: string;
  isrc?: string;
  amplify?: number;
  fade_in?: number;
  fade_out?: number;
  cue_in?: number;
  cue_out?: number;
  song?: {
    art: string;
  };
}

const StationMedia: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  const [activeTab, setActiveTab] = useState<'files' | 'titles'>('files');
  const [currentPath, setCurrentPath] = useState('');

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ path: string, name: string } | null>(null);
  const [renameNewName, setRenameNewName] = useState('');

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedFolderForLink, setSelectedFolderForLink] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data: media, isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/media/`);
      return response.data;
    },
  });

  const { data: playlists } = useQuery<any[]>({
    queryKey: ['playlists', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/playlists/`);
      return response.data;
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return axios.post(`/stations/${station_short_name}/media/mkdir/`, { name, path: currentPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
    },
  });

  const moveMediaMutation = useMutation({
    mutationFn: async ({ source_path, dest_folder }: { source_path: string, dest_folder: string }) => {
      return axios.post(`/stations/${station_short_name}/media/move/`, { source_path, dest_folder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ old_path, new_name }: { old_path: string, new_name: string }) => {
      return axios.post(`/stations/${station_short_name}/media/rename/`, { old_path, new_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsRenameModalOpen(false);
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (path: string) => {
      return axios.post(`/stations/${station_short_name}/media/delete-file/`, { path });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (path: string) => {
      return axios.post(`/stations/${station_short_name}/media/delete-folder/`, { path });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
    },
  });

  const updateMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.patch(`/stations/${station_short_name}/media/${data.id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsEditModalOpen(false);
    },
  });

  const linkFolderToPlaylistMutation = useMutation({
    mutationFn: async ({ path, playlistId }: { path: string, playlistId: string }) => {
      return axios.post(`/stations/${station_short_name}/media/assign-folder-to-playlist/`, { 
        folder_path: path, 
        playlist_id: playlistId 
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsLinkModalOpen(false);
      setSelectedFolderForLink(null);
      setSelectedPlaylistId('');
      alert(`${response.data.count} fichiers du dossier "${response.data.folder}" ont été ajoutés à la playlist "${response.data.playlist}" !`);
    },
    onError: (error: any) => {
      alert(`Erreur : ${error.response?.data?.error || 'Une erreur est survenue'}`);
    }
  });

  const [draggedItem, setDraggedItem] = useState<any>(null);

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetFolder: any) => {
    if (draggedItem && draggedItem.path !== targetFolder.path) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolder: any) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    if (data.path !== targetFolder.path) {
      moveMediaMutation.mutate({ source_path: data.path, dest_folder: targetFolder.path });
    }
    setDraggedItem(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    formData.append('path', currentPath);

    try {
      await axios.post(`/stations/${station_short_name}/media/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  const handleDeleteMedia = (file: any) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le fichier "${file.path}" ?`)) {
      deleteMediaMutation.mutate(file.path);
    }
  };

  const handleEditClick = (file: any) => {
    if (file.type === 'directory') {
      const name = file.name || file.path.split('/').pop();
      setRenameTarget({ path: file.path, name });
      setRenameNewName(name);
      setIsRenameModalOpen(true);
    } else {
      setSelectedMedia(file);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteFolder = (path: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le dossier "${path}" et tout son contenu ?`)) {
      deleteFolderMutation.mutate(path);
    }
  };

  const handleRenameSubmit = () => {
    if (renameTarget && renameNewName) {
      renameMutation.mutate({ old_path: renameTarget.path, new_name: renameNewName });
    }
  };

  const handleSaveMedia = (data: any) => {
    updateMediaMutation.mutate(data);
  };

  // Optimisation : Filtrage par dossier courant
  const filteredMedia = media?.filter(file => {
    const matchesSearch = searchTerm === '' || 
      file.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      file.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.path?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm !== '') return matchesSearch;

    const filePath = file.path || '';
    if (currentPath === '') {
      return !filePath.includes('/');
    } else {
      return filePath.startsWith(currentPath + '/') && 
             filePath.substring(currentPath.length + 1).indexOf('/') === -1;
    }
  });

  const breadcrumbs = currentPath.split('/').filter(p => p !== '');

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSearchTerm('');
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
    <div className="container-fluid px-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small text-uppercase fw-700 ls-1 mb-2">
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted-soft">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to={`/station/${station_short_name}`} className="text-decoration-none text-muted-soft">{station_short_name}</Link></li>
              <li className="breadcrumb-item text-primary active" aria-current="page">Médias</li>
            </ol>
          </nav>
          <h1 className="fw-800 text-main mb-0">Gestion des Médias</h1>
        </div>
        <div className="d-flex gap-2">
          <div className="bg-light-soft rounded-3 p-1 d-flex gap-1 me-2 shadow-sm border border-white border-opacity-10">
            <Button 
              variant={activeTab === 'files' ? 'danger' : 'link'} 
              size="sm" 
              className={`px-3 py-1 fw-700 ${activeTab === 'files' ? 'text-white' : 'text-muted-soft'}`}
              onClick={() => setActiveTab('files')}
              icon={<Folder size={16} />}
            >
              Fichiers
            </Button>
            <Button 
              variant={activeTab === 'titles' ? 'danger' : 'link'} 
              size="sm" 
              className={`px-3 py-1 fw-700 ${activeTab === 'titles' ? 'text-white' : 'text-muted-soft'}`}
              onClick={() => setActiveTab('titles')}
              icon={<Type size={16} />}
            >
              Mise à jour Titres
            </Button>
          </div>
          <Button variant="light" icon={<FolderPlus size={20} />} onClick={() => setIsNewFolderModalOpen(true)}>
            Nouveau dossier
          </Button>
          <Button variant="light" icon={<FileText size={20} />} onClick={() => setIsImportModalOpen(true)}>
            Importer
          </Button>
          <Button variant="danger" icon={<Upload size={20} />} onClick={() => setIsUploadModalOpen(true)}>
            Transférer
          </Button>
        </div>
      </div>

      {activeTab === 'titles' ? (
        <TitleManager />
      ) : (
        <div className="bw-section p-0 overflow-hidden">
          <div className="p-3 border-bottom bg-light-soft d-flex align-items-center gap-2 overflow-x-auto">
            <Button 
              variant="link" 
              size="sm" 
              className={`p-1 ${currentPath === '' ? 'text-main fw-800' : 'text-muted-soft'}`}
              onClick={() => navigateTo('')}
            >
              Station Media
            </Button>
            {breadcrumbs.map((crumb, idx) => {
              const path = breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={path}>
                  <ChevronRight size={14} className="text-muted-soft opacity-50" />
                  <Button 
                    variant="link" 
                    size="sm" 
                    className={`p-1 ${idx === breadcrumbs.length - 1 ? 'text-main fw-800' : 'text-muted-soft'}`}
                    onClick={() => navigateTo(path)}
                  >
                    {crumb}
                  </Button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="p-4 border-bottom bg-light-soft d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="position-relative flex-grow-1 max-width-md">
              <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted opacity-50" size={18} />
              <input 
                type="text" 
                className="form-control ps-5 bg-surface border-0 shadow-none" 
                placeholder="Rechercher un fichier ou un dossier..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-3">
              <div 
                className={`p-2 rounded-3 border-2 border-dashed transition-all ${draggedItem ? 'border-primary bg-primary-soft scale-110 shadow-sm' : 'border-transparent text-muted-soft'}`}
                onDragOver={(e) => {
                  if (currentPath !== '') {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = JSON.parse(e.dataTransfer.getData('application/json'));
                  const parentPath = currentPath.split('/').slice(0, -1).join('/');
                  moveMediaMutation.mutate({ 
                    source_path: data.path, 
                    dest_folder: parentPath 
                  });
                  setDraggedItem(null);
                }}
              >
                <ArrowLeft size={20} className={draggedItem ? 'text-primary animate-pulse' : 'opacity-20'} />
                {draggedItem && <span className="ms-2 smaller fw-700 text-primary">Déplacer vers parent</span>}
              </div>
              <div className="vr opacity-10"></div>
              <span className="text-muted-soft small fw-600">{media?.length || 0} fichiers</span>
              <div className="vr opacity-10"></div>
              <Button variant="link" size="sm" icon={<CheckSquare size={18} />} className="p-0 text-muted-soft fw-600">Sélectionner</Button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Nom</th>
                  <th>Artiste / Album</th>
                  <th>Durée</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <Music size={48} className="text-muted-soft opacity-20 mb-3" />
                      <p className="text-muted-soft fw-600">Aucun fichier média trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredMedia?.map((file: any) => (
                    <tr 
                      key={file.id || file.path} 
                      className={`hover-bg-light-soft transition-all ${draggedItem?.path === file.path ? 'opacity-50' : ''}`}
                      draggable={file.type !== 'directory' || true} // On peut déplacer fichiers et dossiers
                      onDragStart={(e) => handleDragStart(e, file)}
                      onDragOver={(e) => file.type === 'directory' ? handleDragOver(e, file) : undefined}
                      onDrop={(e) => file.type === 'directory' ? handleDrop(e, file) : undefined}
                    >
                      <td className="ps-4">
                        <div className="bg-light-soft rounded-3 overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', minWidth: '44px' }}>
                          {file.type === 'directory' ? (
                            <div className="bg-primary-soft text-primary w-100 h-100 d-flex align-items-center justify-content-center">
                              <FolderPlus size={18} />
                            </div>
                          ) : file.song?.art ? (
                            <img src={file.song.art} alt="Art" className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <div className="bg-primary-soft text-primary w-100 h-100 d-flex align-items-center justify-content-center">
                              <FileAudio size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td 
                        className={file.type === 'directory' ? 'cursor-pointer' : ''}
                        onClick={() => file.type === 'directory' && navigateTo(file.path)}
                      >
                        <p className={`fw-700 text-main mb-0 ${file.type === 'directory' ? 'hover-text-primary' : ''}`}>
                          {file.type === 'directory' && <Folder size={16} className="me-2 text-primary opacity-50" />}
                          {file.title || file.name || (file.path_short || file.path)?.split('/').pop()}
                        </p>
                        <span className="text-muted-soft smaller fw-600">{file.path_short || file.path}</span>
                      </td>
                      <td>
                        <p className="text-main mb-0 small fw-600">{file.artist || (file.type === 'directory' ? '' : 'Artiste inconnu')}</p>
                        <span className="text-muted-soft smaller">{file.album || (file.type === 'directory' ? '' : 'Album inconnu')}</span>
                        {file.playlists && file.playlists.length > 0 && (
                          <div className="mt-1 d-flex flex-wrap gap-1">
                            {file.playlists.map((pid: number) => {
                              const p = playlists?.find(pl => pl.id === pid);
                              return p ? (
                                <span key={pid} className="badge bg-primary-soft text-primary smaller fw-600 px-2 py-1">
                                  {p.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        {file.type !== 'directory' && (
                          <span className="badge bg-light-soft text-muted-soft fw-700">{file.length_text}</span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {file.type === 'directory' ? (
                            <>
                              <Button variant="light" size="sm" icon={<Music size={16} />} title="Lier à une playlist" onClick={() => {
                                setSelectedFolderForLink(file.path);
                                setIsLinkModalOpen(true);
                              }} />
                              <Button variant="light" size="sm" icon={<Edit2 size={16} />} onClick={() => handleEditClick(file)} />
                              <Button variant="light" size="sm" className="hover-text-danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteFolder(file.path)} />
                            </>
                          ) : (
                            <>
                              <Button variant="light" size="sm" icon={<Edit2 size={16} />} onClick={() => handleEditClick(file)} />
                              <Button variant="light" size="sm" className="hover-text-danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteMedia(file)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => !isUploading && setIsUploadModalOpen(false)} 
        title={t('media.upload_modal.title')}
        size="lg"
      >
        <div className="border-2 border-dashed border-primary-subtle rounded-4 p-5 text-center bg-light-soft transition-all hover-bg-light position-relative">
          {!isUploading ? (
            <>
              <input 
                type="file" 
                className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                accept=".mp3,.ogg,.wav,.flac,.aac"
              />
              <Upload size={48} className="text-primary opacity-50 mb-3" />
              <h5 className="fw-bold text-main">{t('media.upload_modal.dropzone')}</h5>
              <p className="text-muted mb-4">{t('media.upload_modal.formats')}</p>
              <Button variant="primary">{t('media.upload_modal.browse')}</Button>
            </>
          ) : (
            <div className="py-3">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="fw-bold text-main mb-2">Téléchargement en cours...</h5>
              <div className="progress bg-white-soft" style={{ height: '10px', borderRadius: '5px' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                  role="progressbar" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 fw-bold text-primary">{uploadProgress}%</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title={t('media.new_folder')}
      >
        <div className="p-2">
          <Input 
            label={t('media.new_folder_name')} 
            value={newFolderName} 
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="ex: Musique 2024"
            autoFocus
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={() => setIsNewFolderModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleCreateFolder} loading={createFolderMutation.isPending}>{t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title={t('common.rename')}
      >
        <div className="p-2">
          <Input 
            label={t('common.name')} 
            value={renameNewName} 
            onChange={(e) => setRenameNewName(e.target.value)}
            placeholder="Nouveau nom..."
            autoFocus
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={() => setIsRenameModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleRenameSubmit} loading={renameMutation.isPending}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Lier le dossier à une playlist"
      >
        <div className="p-2">
          <p className="text-muted-soft mb-4">
            Tous les médias présents dans <strong>{selectedFolderForLink}</strong> (et ses sous-dossiers) seront automatiquement ajoutés à la playlist sélectionnée.
          </p>
          <div className="mb-4">
            <label className="form-label fw-700 text-main small text-uppercase ls-1">Sélectionner une playlist</label>
            <select 
              className="form-select bg-surface border-0 shadow-none"
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
            >
              <option value="">Choisir une playlist...</option>
              {playlists?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="light" onClick={() => setIsLinkModalOpen(false)}>Annuler</Button>
            <Button 
              variant="danger" 
              onClick={() => linkFolderToPlaylistMutation.mutate({ path: selectedFolderForLink!, playlistId: selectedPlaylistId })}
              disabled={!selectedPlaylistId || linkFolderToPlaylistMutation.isPending}
              loading={linkFolderToPlaylistMutation.isPending}
            >
              Lier le dossier
            </Button>
          </div>
        </div>
      </Modal>

      <MediaEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveMedia}
        media={selectedMedia}
        isLoading={updateMediaMutation.isPending}
      />

      <MediaImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default StationMedia;
