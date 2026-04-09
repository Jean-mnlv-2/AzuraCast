import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Activity,
  Radio,
  ExternalLink
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface HlsStream {
  id: number;
  name: string;
  format: string;
  bitrate: number;
  listeners: number;
}

const StationHlsStreams: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<HlsStream | null>(null);
  
  const { data: hls_streams, isLoading } = useQuery<HlsStream[]>({
    queryKey: ['hls_streams', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/hls_streams/`);
      return response.data;
    },
  });

  const createHlsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedStream) {
        return axios.patch(`/stations/${station_short_name}/hls_streams/${selectedStream.id}/`, data);
      }
      return axios.post(`/stations/${station_short_name}/hls_streams/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hls_streams', station_short_name] });
      setIsModalOpen(false);
      setSelectedStream(null);
    },
  });

  const deleteHlsMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`/stations/${station_short_name}/hls_streams/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hls_streams', station_short_name] });
    },
  });

  const handleEditClick = (stream: HlsStream) => {
    setSelectedStream(stream);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    createHlsMutation.mutate(data);
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">{t('nav.hls_streams')}</h1>
          <p className="text-muted mb-0">Configurez vos flux de diffusion HLS adaptatifs.</p>
        </div>
        <Button 
          variant="danger" 
          icon={<Plus size={20} />} 
          onClick={() => setIsModalOpen(true)}
        >
          Nouveau Flux HLS
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedStream(null); }} title={selectedStream ? "Modifier Flux HLS" : "Nouveau Flux HLS"}>
        <form onSubmit={handleCreateSubmit}>
          <Input name="name" label="Nom du Flux" placeholder="ex: Flux HD" defaultValue={selectedStream?.name} required />
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase">Format</label>
            <select name="format" className="form-select" defaultValue={selectedStream?.format || 'aac'} required>
              <option value="aac">AAC (Low Complexity)</option>
              <option value="aac_he_v1">HE-AAC v1</option>
              <option value="aac_he_v2">HE-AAC v2</option>
            </select>
          </div>
          <Input name="bitrate" type="number" label="Bitrate (kbps)" placeholder="ex: 128" defaultValue={selectedStream?.bitrate} required />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" onClick={() => { setIsModalOpen(false); setSelectedStream(null); }}>Annuler</Button>
            <Button type="submit" variant="danger" loading={createHlsMutation.isPending}>{selectedStream ? "Enregistrer" : "Créer"}</Button>
          </div>
        </form>
      </Modal>

      <div className="row g-4">
        {hls_streams?.map((stream) => (
          <div key={stream.id} className="col-12 col-lg-6">
            <Card 
              className="h-100"
              headerActions={
                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="light" 
                    size="sm" 
                    icon={<Settings size={16} />} 
                    onClick={() => handleEditClick(stream)} 
                    title="Paramètres" 
                  />
                  <Button 
                    variant="light" 
                    size="sm" 
                    icon={<Trash2 size={16} />} 
                    onClick={() => {
                      if (window.confirm('Voulez-vous vraiment supprimer ce flux HLS ?')) {
                        deleteHlsMutation.mutate(stream.id);
                      }
                    }} 
                    title="Supprimer" 
                  />
                </div>
              }
            >
              <div className="d-flex align-items-center gap-4">
                <div className="bg-light-soft rounded-3 p-3 text-danger">
                  <Activity size={32} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold">{stream.name}</h5>
                    <span className="badge bg-light text-muted border small">{stream.format.toUpperCase()}</span>
                  </div>
                  <div className="d-flex gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-1"><Radio size={14} /> {stream.bitrate}kbps</span>
                    <span className="d-flex align-items-center gap-1"><Activity size={14} /> {stream.listeners} auditeurs</span>
                  </div>
                </div>
                <Button variant="light" size="sm" icon={<ExternalLink size={16} />} />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StationHlsStreams;
