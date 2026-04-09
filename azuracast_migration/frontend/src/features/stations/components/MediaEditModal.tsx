import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Save, Info, Music, Settings2 } from 'lucide-react';

interface MediaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  media: any;
  isLoading?: boolean;
}

const MediaEditModal: React.FC<MediaEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  media,
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        artist: media.artist || '',
        album: media.album || '',
        genre: media.genre || '',
        isrc: media.isrc || '',
        amplify: media.amplify || '',
        fade_in: media.fade_in || '',
        fade_out: media.fade_out || '',
        cue_in: media.cue_in || '',
        cue_out: media.cue_out || '',
      });
    }
  }, [media]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('common.edit') + ": " + (media?.title || media?.path_short)}
      size="lg"
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={isLoading} icon={<Save size={18} />}>
            {t('common.save_changes')}
          </Button>
        </>
      }
    >
      <ul className="nav nav-tabs border-0 mb-4 bg-light-soft p-1 rounded-3">
        <li className="nav-item flex-grow-1">
          <button 
            className={`nav-link border-0 w-100 rounded-2 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'basic' ? 'bg-white shadow-sm text-danger active' : 'text-muted'}`}
            onClick={() => setActiveTab('basic')}
          >
            <Music size={16} /> {t('media.upload_modal.browse')}
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button 
            className={`nav-link border-0 w-100 rounded-2 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'advanced' ? 'bg-white shadow-sm text-danger active' : 'text-muted'}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Settings2 size={16} /> {t('stations.configuration')}
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="row g-3">
            <div className="col-md-6">
              <Input label="Titre" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Input label="Artiste" name="artist" value={formData.artist} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Input label="Album" name="album" value={formData.album} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Input label="Genre" name="genre" value={formData.genre} onChange={handleChange} />
            </div>
            <div className="col-12">
              <Input label="ISRC" name="isrc" value={formData.isrc} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="row g-3">
            <div className="col-12">
              <div className="alert bg-primary bg-opacity-10 border-0 rounded-3 d-flex gap-3 p-3 mb-4">
                <Info size={20} className="text-primary flex-shrink-0" />
                <div className="small text-primary">
                  Ces paramètres contrôlent la manière dont le morceau est traité par l'AutoDJ BantuWave.
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <Input label="Amplification (dB)" type="number" name="amplify" value={formData.amplify} onChange={handleChange} step="0.1" />
            </div>
            <div className="col-md-6">
              <Input label="Fondu d'entrée (sec)" type="number" name="fade_in" value={formData.fade_in} onChange={handleChange} step="0.1" />
            </div>
            <div className="col-md-6">
              <Input label="Fondu de sortie (sec)" type="number" name="fade_out" value={formData.fade_out} onChange={handleChange} step="0.1" />
            </div>
            <div className="col-md-6">
              <Input label="Point d'entrée (sec)" type="number" name="cue_in" value={formData.cue_in} onChange={handleChange} step="0.1" />
            </div>
            <div className="col-md-6">
              <Input label="Point de sortie (sec)" type="number" name="cue_out" value={formData.cue_out} onChange={handleChange} step="0.1" />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default MediaEditModal;
