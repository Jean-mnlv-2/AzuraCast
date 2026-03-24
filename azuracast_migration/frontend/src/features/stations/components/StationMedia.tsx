import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { 
  Music, 
  Upload, 
  FolderPlus, 
  Search, 
  MoreVertical, 
  Play, 
  Trash2, 
  CheckSquare,
  FileAudio,
  Folder,
  Edit2
} from 'lucide-react';
import axios from '../../../api/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import MediaEditModal from './MediaEditModal';

interface MediaFile {
  id: number;
  path_short: string;
  artist: string;
  title: string;
  album: string;
  length_text: string;
  bitrate: number;
  genre?: string;
  isrc?: string;
  amplify?: number;
  fade_in?: number;
  fade_out?: number;
  cue_in?: number;
  cue_out?: number;
}

const StationMedia: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return axios.post(`/stations/${station_short_name}/media/mkdir/`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return axios.post(`/stations/${station_short_name}/media/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsUploadModalOpen(false);
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`/stations/${station_short_name}/media/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadMediaMutation.mutate(files[0]);
    }
  };

  const { data: media, isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/media/`);
      return response.data;
    },
  });

  const updateMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.patch(`/stations/${station_short_name}/media/${selectedMedia?.id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', station_short_name] });
      setIsEditModalOpen(false);
      setSelectedMedia(null);
    },
  });

  const handleEditClick = (file: MediaFile) => {
    setSelectedMedia(file);
    setIsEditModalOpen(true);
  };

  const handleSaveMedia = (data: any) => {
    updateMediaMutation.mutate(data);
  };

  const filteredMedia = media?.filter(file => 
    file.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    file.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.path_short?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Button variant="light" icon={<FolderPlus size={20} />} onClick={() => setIsNewFolderModalOpen(true)}>
            Nouveau dossier
          </Button>
          <Button variant="danger" icon={<Upload size={20} />} onClick={() => setIsUploadModalOpen(true)}>
            Transférer
          </Button>
        </div>
      </div>

      <div className="bw-section p-0 overflow-hidden">
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
                filteredMedia?.map((file) => (
                  <tr key={file.id} className="hover-bg-light-soft transition-all">
                    <td className="ps-4">
                      <div className="bg-primary-soft text-primary p-2 rounded-3">
                        <FileAudio size={18} />
                      </div>
                    </td>
                    <td>
                      <p className="fw-700 text-main mb-0">{file.title || file.path_short.split('/').pop()}</p>
                      <span className="text-muted-soft smaller fw-600">{file.path_short}</span>
                    </td>
                    <td>
                      <p className="text-main mb-0 small fw-600">{file.artist || 'Artiste inconnu'}</p>
                      <span className="text-muted-soft smaller">{file.album || 'Album inconnu'}</span>
                    </td>
                    <td>
                      <span className="badge bg-light-soft text-muted-soft fw-700">{file.length_text}</span>
                    </td>
                    <td className="pe-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" size="sm" icon={<Edit2 size={16} />} onClick={() => handleEditClick(file)} />
                        <Button variant="light" size="sm" className="hover-text-danger" icon={<Trash2 size={16} />} onClick={() => deleteMediaMutation.mutate(file.id)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        title={t('media.upload_modal.title')}
        size="lg"
      >
        <div className="border-2 border-dashed border-primary-subtle rounded-4 p-5 text-center bg-light-soft transition-all hover-bg-light position-relative">
          <input 
            type="file" 
            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" 
            onChange={handleFileUpload}
            accept=".mp3,.ogg,.wav,.flac,.aac"
          />
          <Upload size={48} className="text-primary opacity-50 mb-3" />
          <h5 className="fw-bold text-main">{t('media.upload_modal.dropzone')}</h5>
          <p className="text-muted mb-4">{t('media.upload_modal.formats')}</p>
          <Button variant="primary" loading={uploadMediaMutation.isPending}>{t('media.upload_modal.browse')}</Button>
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

      <MediaEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveMedia}
        media={selectedMedia}
        isLoading={updateMediaMutation.isPending}
      />
    </div>
  );
};

export default StationMedia;
