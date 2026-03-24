import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Save, Info, ListMusic, Clock, Settings2, Calendar } from 'lucide-react';

interface PlaylistEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  playlist: any;
  isLoading?: boolean;
}

const PlaylistEditModal: React.FC<PlaylistEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  playlist,
  isLoading = false 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (playlist) {
      setFormData({
        name: playlist.name || '',
        type: playlist.type || 'default',
        source: playlist.source || 'songs',
        playback_order: playlist.playback_order || 'shuffle',
        is_enabled: playlist.is_enabled !== undefined ? playlist.is_enabled : true,
        weight: playlist.weight || 3,
        play_per_songs: playlist.play_per_songs || 0,
        play_per_minutes: playlist.play_per_minutes || 0,
        play_per_hour_minute: playlist.play_per_hour_minute || 0,
        avoid_duplicates: playlist.avoid_duplicates !== undefined ? playlist.avoid_duplicates : true,
        include_in_requests: playlist.include_in_requests !== undefined ? playlist.include_in_requests : true,
        is_jingle: playlist.is_jingle !== undefined ? playlist.is_jingle : false,
      });
    } else {
      setFormData({
        name: '',
        type: 'default',
        source: 'songs',
        playback_order: 'shuffle',
        is_enabled: true,
        weight: 3,
        play_per_songs: 0,
        play_per_minutes: 0,
        play_per_hour_minute: 0,
        avoid_duplicates: true,
        include_in_requests: true,
        is_jingle: false,
      });
    }
  }, [playlist, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const typeOptions = [
    { value: 'default', label: 'Standard' },
    { value: 'once_per_x_songs', label: 'Une fois toutes les X chansons' },
    { value: 'once_per_x_minutes', label: 'Une fois toutes les X minutes' },
    { value: 'once_per_day', label: 'Une fois par jour' },
    { value: 'custom', label: 'Personnalisé' },
  ];

  const orderOptions = [
    { value: 'shuffle', label: 'Mélangé (Shuffle)' },
    { value: 'random', label: 'Aléatoire (Random)' },
    { value: 'sequential', label: 'Séquentiel' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={playlist ? `${t('common.edit')}: ${playlist.name}` : t('stations.new_playlist')}
      size="lg"
      footer={
        <>
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={isLoading} icon={<Save size={18} />}>
            {t('common.save')}
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
            <ListMusic size={16} /> {t('admin.settings.general')}
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button 
            className={`nav-link border-0 w-100 rounded-2 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'source' ? 'bg-white shadow-sm text-danger active' : 'text-muted'}`}
            onClick={() => setActiveTab('source')}
          >
            <Clock size={16} /> Source & Ordre
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button 
            className={`nav-link border-0 w-100 rounded-2 py-2 small fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'advanced' ? 'bg-white shadow-sm text-danger active' : 'text-muted'}`}
            onClick={() => setActiveTab('advanced')}
          >
            <Settings2 size={16} /> Avancé
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="row g-3">
            <div className="col-md-8">
              <Input label="Nom de la playlist" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="col-md-4">
              <Input label="Poids (Priorité)" type="number" name="weight" value={formData.weight} onChange={handleChange} min="1" max="10" />
            </div>
            <div className="col-md-6">
              <Select label="Type de Playlist" name="type" value={formData.type} options={typeOptions} onChange={handleChange} />
            </div>
            <div className="col-md-6 d-flex align-items-end pb-2">
              <div className="form-check form-switch custom-switch">
                <input className="form-check-input" type="checkbox" name="is_enabled" checked={formData.is_enabled} onChange={handleChange} id="is_enabled" />
                <label className="form-check-label fw-bold small text-uppercase" htmlFor="is_enabled">Activée</label>
              </div>
            </div>

            {formData.type === 'once_per_x_songs' && (
              <div className="col-md-6">
                <Input label="Nombre de chansons" type="number" name="play_per_songs" value={formData.play_per_songs} onChange={handleChange} />
              </div>
            )}
            {formData.type === 'once_per_x_minutes' && (
              <div className="col-md-6">
                <Input label="Nombre de minutes" type="number" name="play_per_minutes" value={formData.play_per_minutes} onChange={handleChange} />
              </div>
            )}
            {formData.type === 'once_per_day' && (
              <div className="col-md-6">
                <Input label="Heure de diffusion (HHMM)" type="number" name="play_per_hour_minute" value={formData.play_per_hour_minute} onChange={handleChange} placeholder="ex: 1430 pour 14h30" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'source' && (
          <div className="row g-3">
            <div className="col-md-6">
              <Select label="Source des titres" name="source" value={formData.source} options={[{value: 'songs', label: 'Fichiers locaux'}, {value: 'remote_url', label: 'URL Distante'}]} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <Select label="Ordre de lecture" name="playback_order" value={formData.playback_order} options={orderOptions} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="row g-3">
            <div className="col-12">
              <div className="alert bg-primary bg-opacity-10 border-0 rounded-3 d-flex gap-3 p-3 mb-4">
                <Info size={20} className="text-primary flex-shrink-0" />
                <div className="small text-primary">
                  Ces paramètres permettent de personnaliser finement le comportement de cette playlist dans BantuWave.
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" name="avoid_duplicates" checked={formData.avoid_duplicates} onChange={handleChange} id="avoid_duplicates" />
                <label className="form-check-label" htmlFor="avoid_duplicates">Éviter les doublons</label>
              </div>
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" name="include_in_requests" checked={formData.include_in_requests} onChange={handleChange} id="include_in_requests" />
                <label className="form-check-label" htmlFor="include_in_requests">Inclure dans les requêtes</label>
              </div>
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" name="is_jingle" checked={formData.is_jingle} onChange={handleChange} id="is_jingle" />
                <label className="form-check-label" htmlFor="is_jingle">Mode Jingle (masquer métadonnées)</label>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default PlaylistEditModal;
