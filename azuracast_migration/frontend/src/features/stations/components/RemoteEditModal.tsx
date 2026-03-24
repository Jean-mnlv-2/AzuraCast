import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Save, Globe, Link, Zap } from 'lucide-react';

interface RemoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  remote: any;
  isLoading?: boolean;
}

const RemoteEditModal: React.FC<RemoteEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  remote,
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (remote) {
      setFormData({
        display_name: remote.display_name || '',
        type: remote.type || 'shoutcast2',
        url: remote.url || '',
        mount: remote.mount || '',
        enable_autodj: remote.enable_autodj !== undefined ? remote.enable_autodj : false,
        autodj_bitrate: remote.autodj_bitrate || 128,
        autodj_format: remote.autodj_format || 'mp3',
      });
    } else {
      setFormData({
        display_name: 'Remote Stream',
        type: 'shoutcast2',
        url: 'http://remote-server.com',
        mount: '/stream',
        enable_autodj: false,
        autodj_bitrate: 128,
        autodj_format: 'mp3',
      });
    }
  }, [remote, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const typeOptions = [
    { value: 'shoutcast1', label: 'Shoutcast v1' },
    { value: 'shoutcast2', label: 'Shoutcast v2' },
    { value: 'icecast', label: 'Icecast v2.4+' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={remote ? `Modifier le flux distant: ${remote.display_name}` : 'Nouveau flux distant'}
      size="lg"
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={isLoading} icon={<Save size={18} />}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-8">
          <Input 
            label="Nom d'affichage" 
            name="display_name" 
            value={formData.display_name} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="col-md-4">
          <Select 
            label="Type de serveur" 
            name="type" 
            value={formData.type} 
            options={typeOptions} 
            onChange={handleChange} 
          />
        </div>

        <div className="col-md-8">
          <Input 
            label="URL du serveur (ex: http://remote-radio.com:8000)" 
            name="url" 
            value={formData.url} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="col-md-4">
          <Input 
            label="Point de montage (ex: /stream)" 
            name="mount" 
            value={formData.mount} 
            onChange={handleChange} 
          />
        </div>

        <div className="col-12 mt-4">
          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              name="enable_autodj" 
              checked={formData.enable_autodj} 
              onChange={handleChange} 
              id="enable_autodj_remote" 
            />
            <label className="form-check-label fw-bold" htmlFor="enable_autodj_remote">
              Relayer via l'AutoDJ local
            </label>
            <div className="small text-muted">
              Si activé, l'AutoDJ local se connectera à ce flux distant et le diffusera sur vos propres points de montage.
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RemoteEditModal;
