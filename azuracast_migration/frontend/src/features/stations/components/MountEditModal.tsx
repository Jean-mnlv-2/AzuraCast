import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Save, Info, Volume2, Shield, Settings2 } from 'lucide-react';

interface MountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  mount: any;
  isLoading?: boolean;
}

const MountEditModal: React.FC<MountEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  mount,
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (mount) {
      setFormData({
        name: mount.name || '',
        display_name: mount.display_name || '',
        is_default: mount.is_default || false,
        is_public: mount.is_public || true,
        autodj_bitrate: mount.autodj_bitrate || 128,
        autodj_format: mount.autodj_format || 'mp3',
        enable_autodj: mount.enable_autodj !== undefined ? mount.enable_autodj : true,
      });
    } else {
      setFormData({
        name: '/radio.mp3',
        display_name: 'Main Stream',
        is_default: false,
        is_public: true,
        autodj_bitrate: 128,
        autodj_format: 'mp3',
        enable_autodj: true,
      });
    }
  }, [mount, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatOptions = [
    { value: 'mp3', label: 'MP3' },
    { value: 'aac', label: 'AAC+' },
    { value: 'ogg', label: 'OGG Vorbis' },
    { value: 'opus', label: 'OPUS' },
  ];

  const bitrateOptions = [
    { value: '32', label: '32 kbps' },
    { value: '64', label: '64 kbps' },
    { value: '96', label: '96 kbps' },
    { value: '128', label: '128 kbps' },
    { value: '192', label: '192 kbps' },
    { value: '256', label: '256 kbps' },
    { value: '320', label: '320 kbps' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mount ? `Modifier le point de montage: ${mount.display_name}` : 'Nouveau point de montage'}
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
        <div className="col-md-6">
          <Input 
            label="Nom du point de montage (ex: /radio.mp3)" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="col-md-6">
          <Input 
            label="Nom d'affichage" 
            name="display_name" 
            value={formData.display_name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="col-md-6">
          <div className="form-check form-switch mb-3 mt-4">
            <input 
              className="form-check-input" 
              type="checkbox" 
              name="is_default" 
              checked={formData.is_default} 
              onChange={handleChange} 
              id="is_default" 
            />
            <label className="form-check-label fw-bold" htmlFor="is_default">Point de montage par défaut</label>
            <div className="small text-muted">Utilisé comme flux principal pour la page publique.</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check form-switch mb-3 mt-4">
            <input 
              className="form-check-input" 
              type="checkbox" 
              name="is_public" 
              checked={formData.is_public} 
              onChange={handleChange} 
              id="is_public" 
            />
            <label className="form-check-label fw-bold" htmlFor="is_public">Flux Public</label>
            <div className="small text-muted">Afficher ce flux sur la page publique et les lecteurs.</div>
          </div>
        </div>

        <div className="col-12 mt-4">
          <h6 className="fw-bold text-main border-bottom pb-2 mb-3">
            <Settings2 size={18} className="me-2" /> Paramètres AutoDJ
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="form-check form-switch mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  name="enable_autodj" 
                  checked={formData.enable_autodj} 
                  onChange={handleChange} 
                  id="enable_autodj" 
                />
                <label className="form-check-label fw-bold" htmlFor="enable_autodj">Activer l'AutoDJ</label>
              </div>
            </div>
            {formData.enable_autodj && (
              <>
                <div className="col-md-4">
                  <Select 
                    label="Format d'encodage" 
                    name="autodj_format" 
                    value={formData.autodj_format} 
                    options={formatOptions} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="col-md-4">
                  <Select 
                    label="Bitrate" 
                    name="autodj_bitrate" 
                    value={formData.autodj_bitrate} 
                    options={bitrateOptions} 
                    onChange={handleChange} 
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-12 mt-4">
          <div className="alert bg-primary bg-opacity-10 border-0 rounded-3 d-flex gap-3 p-3">
            <Info size={20} className="text-primary flex-shrink-0" />
            <div className="small text-primary">
              BantuWave gère automatiquement le transcodage via Liquidsoap pour chaque point de montage activé.
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default MountEditModal;
