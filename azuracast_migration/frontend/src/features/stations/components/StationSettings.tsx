import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { 
  Save, 
  Radio, 
  Zap, 
  Settings as SettingsIcon,
  ChevronLeft,
  Activity,
  Palette,
  Megaphone,
  Plus,
  Trash2,
  Users,
  Calendar,
  Clock,
  Edit,
  Info
} from 'lucide-react';
import axios from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';

const StationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    genre: '',
    url: '',
    is_enabled: true,
    enable_hls: false,
    enable_on_demand: false,
    enable_public_page: true,
    logo_external_url: '',
    branding_config: {
      primary_color: '#1976D2',
      secondary_color: '#D32F2F',
      show_social_widgets: true,
      twitter_handle: '',
      instagram_handle: '',
    },
    ad_config: {
      enabled: false,
      interval_minutes: 30,
      provider: 'local',
    },
    crossfade: 2.0,
  });

  const { data: station, isLoading, refetch } = useQuery({
    queryKey: ['station_settings', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/`);
      return response.data;
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('logo', file);
      try {
        await axios.patch(`/stations/${station_short_name}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        refetch();
      } catch (err) {
        console.error('Logo upload failed', err);
      }
    }
  };

  const { data: advertisements, isLoading: isAdsLoading } = useQuery({
    queryKey: ['station_advertisements', station_short_name],
    queryFn: async () => {
      const response = await axios.get(`/stations/${station_short_name}/advertisements/`);
      return response.data;
    },
  });

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        description: station.description || '',
        genre: station.genre || '',
        url: station.url || '',
        is_enabled: station.is_enabled !== undefined ? station.is_enabled : true,
        enable_hls: station.enable_hls || false,
        enable_on_demand: station.enable_on_demand || false,
        enable_public_page: station.enable_public_page !== undefined ? station.enable_public_page : true,
        logo_external_url: station.logo_external_url || '',
        branding_config: station.branding_config || {
          primary_color: '#1976D2',
          secondary_color: '#D32F2F',
          show_social_widgets: true,
          twitter_handle: '',
          instagram_handle: '',
        },
        ad_config: station.ad_config || {
          enabled: false,
          interval_minutes: 30,
          provider: 'local',
        },
        crossfade: station.crossfade || 2.0,
      });
    }
  }, [station]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.patch(`/stations/${station_short_name}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station_settings', station_short_name] });
      alert(t('station_settings.save_success'));
    },
  });

  const adMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedAd) {
        return axios.patch(`/stations/${station_short_name}/advertisements/${selectedAd.id}/`, data);
      }
      return axios.post(`/stations/${station_short_name}/advertisements/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station_advertisements', station_short_name] });
      setIsAdModalOpen(false);
      setSelectedAd(null);
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      return axios.delete(`/stations/${station_short_name}/advertisements/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station_advertisements', station_short_name] });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleNestedChange = (category: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adFormData = new FormData(e.target as HTMLFormElement);
    
    const startTime = (adFormData.get('start_time') as string)?.replace(':', '') || '0000';
    const endTime = (adFormData.get('end_time') as string)?.replace(':', '') || '2359';
    
    const selectedDays = [];
    for (let i = 0; i < 7; i++) {
      if (adFormData.get(`day_${i}`)) {
        selectedDays.push(i + 1);
      }
    }

    const scheduleItems = [{
      start_time: parseInt(startTime),
      end_time: parseInt(endTime),
      start_date: adFormData.get('start_date') || null,
      end_date: adFormData.get('end_date') || null,
      days: selectedDays.join(','),
    }];

    // Add formatted schedule as JSON string (for multipart handling on backend)
    adFormData.append('schedule_items', JSON.stringify(scheduleItems));

    // Cleanup raw fields from FormData
    adFormData.delete('start_time');
    adFormData.delete('end_time');
    adFormData.delete('start_date');
    adFormData.delete('end_date');
    for (let i = 0; i < 7; i++) adFormData.delete(`day_${i}`);

    // Ensure is_active is a boolean string for FormData
    const isActive = adFormData.get('is_active') === 'on' || adFormData.get('is_active') === 'true';
    adFormData.set('is_active', isActive ? 'true' : 'false');
    
    // Handle numeric fields
    const playInterval = parseInt(adFormData.get('play_interval') as string) || 0;
    adFormData.set('play_interval', playInterval.toString());
    
    const targetPlays = parseInt(adFormData.get('target_plays') as string) || 0;
    adFormData.set('target_plays', targetPlays.toString());
    
    const targetListeners = parseInt(adFormData.get('target_listeners') as string) || 0;
    adFormData.set('target_listeners', targetListeners.toString());

    adMutation.mutate(adFormData);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: t('station_settings.tabs.basic'), icon: <SettingsIcon size={18} /> },
    { id: 'branding', label: t('station_settings.tabs.branding'), icon: <Palette size={18} /> },
    { id: 'ads', label: t('station_settings.tabs.ads'), icon: <Megaphone size={18} /> },
    { id: 'broadcast', label: t('station_settings.tabs.broadcast'), icon: <Radio size={18} /> },
    { id: 'advanced', label: t('station_settings.tabs.advanced'), icon: <Zap size={18} /> },
  ];

  return (
    <div className="container py-4">
      <div className="mb-4">
        <Link to={`/station/${station_short_name}`} className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-2">
          <ChevronLeft size={16} /> {t('station_settings.back_to_profile')}
        </Link>
        <h1 className="fw-800 text-main mb-1">{t('station_settings.title')}</h1>
        <p className="text-muted small">{t('station_settings.subtitle')}</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <div className="bw-section p-2">
            <div className="nav flex-column nav-pills gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-link text-start d-flex align-items-center gap-3 py-3 px-3 rounded-3 border-0 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-muted-soft hover-bg-light'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span className="fw-600">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="bw-section p-4">
            <form onSubmit={handleSubmit}>
              {activeTab === 'basic' && (
                <div className="row g-4">
                  <div className="col-lg-4">
                    <div className="bw-section text-center">
                      <h6 className="fw-800 text-main mb-4 text-uppercase ls-1 small">Logo de la Radio</h6>
                      <div 
                        className="mx-auto mb-4 bg-light-soft rounded-4 d-flex align-items-center justify-content-center overflow-hidden border-2 border-dashed border-muted-soft position-relative hover-bg-light transition-all cursor-pointer" 
                        style={{ width: '160px', height: '160px' }}
                        onClick={() => document.getElementById('logo-settings-upload')?.click()}
                      >
                        {station?.logo || station?.logo_external_url ? (
                          <img 
                            src={station.logo_external_url || (station.logo?.startsWith('http') ? station.logo : `${import.meta.env.VITE_API_URL}${station.logo}`)} 
                            alt="Logo" 
                            className="w-100 h-100 object-fit-cover" 
                          />
                        ) : (
                          <div className="text-center p-3">
                            <Palette size={32} className="text-muted-soft mb-2" />
                            <div className="smaller text-muted-soft fw-600">Cliquer pour changer</div>
                          </div>
                        )}
                        <input id="logo-settings-upload" type="file" className="d-none" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                      <Input 
                        label="Ou URL externe" 
                        placeholder="https://..." 
                        value={formData.logo_external_url || ''} 
                        onChange={e => setFormData({...formData, logo_external_url: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="row g-4">
                      <div className="col-12">
                        <Input 
                          label={t('station_settings.basic.name')} 
                          name="name" 
                          value={formData.name} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted text-uppercase ls-1 mb-2">
                          {t('station_settings.basic.description')}
                        </label>
                        <textarea 
                          className="form-control" 
                          rows={4} 
                          name="description" 
                          value={formData.description} 
                          onChange={handleChange}
                          placeholder="..."
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <Input 
                          label={t('station_settings.basic.genre')} 
                          name="genre" 
                          value={formData.genre} 
                          onChange={handleChange} 
                        />
                      </div>
                      <div className="col-md-6">
                        <Input 
                          label={t('station_settings.basic.url')} 
                          name="url" 
                          value={formData.url} 
                          onChange={handleChange} 
                        />
                      </div>
                      <div className="col-12 mt-3">
                        <div className="form-check form-switch custom-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="enable_public_page" 
                            checked={formData.enable_public_page} 
                            onChange={handleChange} 
                            id="enable_public_page" 
                          />
                          <label className="form-check-label fw-bold text-main" htmlFor="enable_public_page">
                            {t('station_settings.basic.enable_public_page')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div className="row g-4">
                  <div className="col-12">
                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <Palette size={20} className="text-primary" />
                      {t('station_settings.branding.visual')}
                    </h5>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted text-uppercase ls-1">
                          {t('station_settings.branding.primary_color')}
                        </label>
                        <div className="d-flex gap-2">
                          <input 
                            type="color" 
                            className="form-control form-control-color border-0 p-1 rounded-2 shadow-sm" 
                            style={{ width: '60px', height: '45px' }}
                            value={formData.branding_config?.primary_color} 
                            onChange={(e) => handleNestedChange('branding_config', 'primary_color', e.target.value)}
                          />
                          <div className="flex-grow-1">
                            <Input 
                              name="primary_color" 
                              value={formData.branding_config?.primary_color} 
                              onChange={(e) => handleNestedChange('branding_config', 'primary_color', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted text-uppercase ls-1">
                          {t('station_settings.branding.secondary_color')}
                        </label>
                        <div className="d-flex gap-2">
                          <input 
                            type="color" 
                            className="form-control form-control-color border-0 p-1 rounded-2 shadow-sm" 
                            style={{ width: '60px', height: '45px' }}
                            value={formData.branding_config?.secondary_color} 
                            onChange={(e) => handleNestedChange('branding_config', 'secondary_color', e.target.value)}
                          />
                          <div className="flex-grow-1">
                            <Input 
                              name="secondary_color" 
                              value={formData.branding_config?.secondary_color} 
                              onChange={(e) => handleNestedChange('branding_config', 'secondary_color', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-12 mt-2">
                    <hr className="my-4 opacity-10" />
                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                      <Zap size={20} className="text-primary" />
                      {t('station_settings.branding.social')}
                    </h5>
                    <div className="form-check form-switch custom-switch mb-4">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={formData.branding_config?.show_social_widgets} 
                        onChange={(e) => handleNestedChange('branding_config', 'show_social_widgets', e.target.checked)}
                        id="show_social_widgets" 
                      />
                      <label className="form-check-label fw-bold text-main" htmlFor="show_social_widgets">
                        {t('station_settings.branding.show_social')}
                      </label>
                    </div>
                    
                    <div className="row g-4">
                      <div className="col-md-6">
                        <Input 
                          label={t('station_settings.branding.twitter')} 
                          value={formData.branding_config?.twitter_handle} 
                          onChange={(e) => handleNestedChange('branding_config', 'twitter_handle', e.target.value)} 
                        />
                      </div>
                      <div className="col-md-6">
                        <Input 
                          label={t('station_settings.branding.instagram')} 
                          value={formData.branding_config?.instagram_handle} 
                          onChange={(e) => handleNestedChange('branding_config', 'instagram_handle', e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ads' && (
                <div className="row g-4">
                  <div className="col-12">
                    <div className="bw-card-flat bg-primary-soft p-4 mb-4 border-0 d-flex gap-3">
                      <Activity size={24} className="text-primary flex-shrink-0" />
                      <div>
                        <h6 className="fw-bold text-primary mb-1">{t('station_settings.ads.module_title')}</h6>
                        <p className="small text-muted mb-0">
                          {t('station_settings.ads.module_desc')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="form-check form-switch custom-switch mb-4">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={formData.ad_config?.enabled} 
                        onChange={(e) => handleNestedChange('ad_config', 'enabled', e.target.checked)}
                        id="ads_enabled" 
                      />
                      <label className="form-check-label fw-bold text-main" htmlFor="ads_enabled">
                        {t('station_settings.ads.enabled')}
                      </label>
                    </div>
                    
                    {formData.ad_config?.enabled && (
                      <div className="row g-4 mb-5">
                        <div className="col-md-4">
                          <div className="bw-card-flat p-4 bg-light-soft text-center">
                            <div className="smaller text-muted fw-bold text-uppercase ls-1 mb-1">Campagnes Actives</div>
                            <div className="h3 fw-800 text-main mb-0">{advertisements?.filter((a: any) => a.is_active).length || 0}</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="bw-card-flat p-4 bg-light-soft text-center">
                            <div className="smaller text-muted fw-bold text-uppercase ls-1 mb-1">Passages (24h)</div>
                            <div className="h3 fw-800 text-main mb-0">{advertisements?.reduce((acc: number, ad: any) => acc + (ad.playback_count_24h || 0), 0)}</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="bw-card-flat p-4 bg-light-soft text-center">
                            <div className="smaller text-muted fw-bold text-uppercase ls-1 mb-1">Audience (Est.)</div>
                            <div className="h3 fw-800 text-primary mb-0">{advertisements?.reduce((acc: number, ad: any) => acc + (ad.unique_listeners || 0), 0)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.ad_config?.enabled && (
                      <div className="row g-4 p-4 bg-light-soft rounded-4 border border-primary border-opacity-10 mb-5">
                        <div className="col-md-6">
                          <Input 
                            label={t('station_settings.ads.interval')} 
                            type="number" 
                            value={formData.ad_config?.interval_minutes} 
                            onChange={(e) => handleNestedChange('ad_config', 'interval_minutes', parseInt(e.target.value))} 
                          />
                        </div>
                        <div className="col-md-6">
                          <Select 
                            label={t('station_settings.ads.source')} 
                            value={formData.ad_config?.provider} 
                            options={[
                              { value: 'local', label: t('station_settings.ads.sources.local') },
                              { value: 'vast', label: t('station_settings.ads.sources.vast') },
                            ]}
                            onChange={(e) => handleNestedChange('ad_config', 'provider', e.target.value)} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Pro Regie Section */}
                    <div className="mt-4 pt-4 border-top">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                          <h5 className="fw-bold text-main mb-1">{t('station_settings.ads.regie.title')}</h5>
                          <p className="text-muted small mb-0">{t('station_settings.ads.regie.desc')}</p>
                        </div>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          icon={<Plus size={16} />}
                          onClick={() => { setSelectedAd(null); setIsAdModalOpen(true); }}
                        >
                          {t('station_settings.ads.regie.add')}
                        </Button>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead>
                            <tr>
                              <th className="ps-0">{t('station_settings.ads.regie.table.name')}</th>
                              <th>Objectif</th>
                              <th>{t('station_settings.ads.regie.table.schedule')}</th>
                              <th>{t('station_settings.ads.regie.table.status')}</th>
                              <th className="text-end pe-0">{t('common.actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {advertisements?.map((ad: any) => (
                              <tr key={ad.id}>
                                <td className="ps-0 py-3">
                                  <div className="fw-bold text-main">{ad.name}</div>
                                  <div className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                    {ad.audio_file ? `Fichier: ${ad.audio_file.split('/').pop()}` : ad.media_url}
                                  </div>
                                  {ad.target_countries && (
                                    <div className="mt-1">
                                      {ad.target_countries.split(',').map((c: string) => (
                                        <span key={c} className="badge bg-light text-muted smaller me-1">{c.trim()}</span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div className="d-flex flex-column gap-2" style={{ width: '160px' }}>
                                    {/* Progress Plays */}
                                    {ad.target_plays > 0 && (
                                      <div>
                                        <div className="d-flex justify-content-between smaller fw-bold mb-1">
                                          <span><Zap size={10} /> {ad.playback_count || 0} / {ad.target_plays}</span>
                                          <span>{ad.plays_progress_percentage}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                          <div 
                                            className={`progress-bar ${ad.plays_progress_percentage >= 100 ? 'bg-success' : 'bg-primary'}`} 
                                            style={{ width: `${Math.min(100, ad.plays_progress_percentage)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                    {/* Progress Listeners */}
                                    {ad.target_listeners > 0 && (
                                      <div>
                                        <div className="d-flex justify-content-between smaller fw-bold mb-1">
                                          <span><Users size={10} /> {ad.unique_listeners || 0} / {ad.target_listeners}</span>
                                          <span>{ad.listeners_progress_percentage}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '4px' }}>
                                          <div 
                                            className={`progress-bar ${ad.listeners_progress_percentage >= 100 ? 'bg-success' : 'bg-info'}`} 
                                            style={{ width: `${Math.min(100, ad.listeners_progress_percentage)}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}
                                    {ad.target_plays <= 0 && ad.target_listeners <= 0 && (
                                      <span className="text-muted smaller fw-600">Illimité</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2 small text-muted">
                                    <Clock size={14} /> {ad.play_interval > 0 ? `${ad.play_interval} min` : 'Scheduled'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge rounded-pill px-3 py-1 ${ad.is_active ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                    {ad.is_active ? t('common.online') : t('common.offline')}
                                  </span>
                                </td>
                                <td className="pe-0 text-end">
                                  <div className="d-flex justify-content-end gap-1">
                                    <Button 
                                      variant="light" 
                                      size="sm" 
                                      className="p-2"
                                      onClick={() => { setSelectedAd(ad); setIsAdModalOpen(true); }}
                                      icon={<Edit size={16} className="text-muted" />}
                                    />
                                    <Button 
                                      variant="light" 
                                      size="sm" 
                                      className="p-2 hover-bg-danger-light"
                                      onClick={() => {
                                        if (window.confirm(t('station_settings.ads.regie.delete_confirm'))) {
                                          deleteAdMutation.mutate(ad.id);
                                        }
                                      }}
                                      icon={<Trash2 size={16} className="text-danger" />}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {(!advertisements || advertisements.length === 0) && !isAdsLoading && (
                              <tr>
                                <td colSpan={4} className="text-center py-5 text-muted">
                                  {t('station_settings.ads.regie.no_ads')}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'broadcast' && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <Input 
                      label={t('station_settings.broadcast.crossfade')} 
                      type="number" 
                      step="0.1" 
                      name="crossfade" 
                      value={formData.crossfade} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="col-12 mt-3">
                    <div className="form-check form-switch custom-switch mb-3">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        name="is_enabled" 
                        checked={formData.is_enabled} 
                        onChange={handleChange} 
                        id="is_enabled_settings" 
                      />
                      <label className="form-check-label fw-bold text-main" htmlFor="is_enabled_settings">
                        {t('station_settings.broadcast.enabled')}
                      </label>
                    </div>
                    <div className="form-check form-switch custom-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        name="enable_hls" 
                        checked={formData.enable_hls} 
                        onChange={handleChange} 
                        id="enable_hls" 
                      />
                      <label className="form-check-label fw-bold text-main" htmlFor="enable_hls">
                        {t('station_settings.broadcast.hls')}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="row g-4">
                  <div className="col-12">
                    <div className="bw-card-flat bg-danger-soft p-4 mb-4 border-0 d-flex gap-3">
                      <Info size={24} className="text-danger flex-shrink-0" />
                      <div>
                        <h6 className="fw-bold text-danger mb-1">{t('station_settings.advanced.info_title')}</h6>
                        <p className="small text-muted mb-0">
                          {t('station_settings.advanced.info_desc')}
                        </p>
                      </div>
                    </div>
                    <div className="bw-section bg-light-soft border-0 d-flex align-items-center gap-3 p-4">
                      <Activity size={24} className="text-success" />
                      <div>
                        <div className="fw-bold text-main">{t('station_settings.advanced.liquidsoap')}</div>
                        <div className="small text-muted">{t('station_settings.advanced.liquidsoap_version')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-top d-flex justify-content-end">
                <Button 
                  variant="primary" 
                  type="submit" 
                  loading={saveMutation.isPending} 
                  icon={<Save size={18} />}
                  className="px-5 shadow-sm"
                >
                  {t('common.save_changes')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Ad Modal */}
      <Modal 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
        title={selectedAd ? t('station_settings.ads.regie.edit') : t('station_settings.ads.regie.add')}
        size="lg"
      >
        <form onSubmit={handleAdSubmit}>
          <div className="row g-4">
            <div className="col-12">
              <Input 
                label={t('station_settings.ads.regie.modal.name')} 
                name="name" 
                defaultValue={selectedAd?.name || ''} 
                required 
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-bold text-muted text-uppercase ls-1">{t('station_settings.ads.regie.modal.audio_file')}</label>
              <input type="file" name="audio_file" className="form-control" accept="audio/*" />
              <div className="small text-muted mt-1">{t('station_settings.ads.regie.modal.audio_file_help')}</div>
              {selectedAd?.audio_file && (
                <div className="mt-2 small text-primary fw-bold">
                  Fichier actuel : {selectedAd.audio_file.split('/').pop()}
                </div>
              )}
            </div>
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 my-2">
                <hr className="flex-grow-1 opacity-10" />
                <span className="small text-muted fw-bold">OU</span>
                <hr className="flex-grow-1 opacity-10" />
              </div>
            </div>
            <div className="col-12">
              <Input 
                label={t('station_settings.ads.regie.modal.media_url')} 
                name="media_url" 
                defaultValue={selectedAd?.media_url || ''} 
              />
            </div>
            
            <div className="col-md-6">
              <Input 
                label="Objectif de diffusions" 
                name="target_plays" 
                type="number"
                defaultValue={selectedAd?.target_plays || 0} 
                helperText="Total passages prévus (0 = illimité)"
              />
            </div>
            <div className="col-md-6">
              <Input 
                label="Objectif d'auditeurs" 
                name="target_listeners" 
                type="number"
                defaultValue={selectedAd?.target_listeners || 0} 
                helperText="Total auditeurs uniques visés (0 = illimité)"
              />
            </div>
            <div className="col-md-6">
              <Input 
                label="Intervalle (minutes)" 
                name="play_interval" 
                type="number"
                defaultValue={selectedAd?.play_interval || 0} 
                helperText={t('station_settings.ads.regie.modal.play_interval_help')}
              />
            </div>

            <div className="col-12">
              <div className="bw-card-flat p-4 bg-primary-soft border-0">
                <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                  <Zap size={18} /> Ciblage Géographique (DAI)
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <Input 
                      label="Pays cibles" 
                      name="target_countries" 
                      placeholder="Ex: CM, FR, BE"
                      defaultValue={selectedAd?.target_countries || ''} 
                      helperText="Codes ISO séparés par des virgules"
                    />
                  </div>
                  <div className="col-md-6">
                    <Input 
                      label="Villes cibles" 
                      name="target_cities" 
                      placeholder="Ex: Douala, Paris"
                      defaultValue={selectedAd?.target_cities || ''} 
                      helperText="Noms des villes séparés par des virgules"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="form-check form-switch custom-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  name="is_active" 
                  defaultChecked={selectedAd ? selectedAd.is_active : true} 
                  id="ad_is_active" 
                />
                <label className="form-check-label fw-bold" htmlFor="ad_is_active">Activer cette publicité</label>
              </div>
            </div>

            <div className="col-12 mt-2">
              <div className="bw-card-flat p-4 bg-light-soft">
                <h6 className="fw-bold text-main mb-4 d-flex align-items-center gap-2">
                  <Calendar size={18} className="text-primary" /> Planification Précise
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <Input 
                      label={t('station_settings.ads.regie.modal.start_time')} 
                      name="start_time" 
                      type="time" 
                      defaultValue={selectedAd?.schedule_items?.[0]?.start_time ? 
                        String(selectedAd.schedule_items[0].start_time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2') : 
                        "09:00"} 
                    />
                  </div>
                  <div className="col-md-6">
                    <Input 
                      label={t('station_settings.ads.regie.modal.end_time')} 
                      name="end_time" 
                      type="time" 
                      defaultValue={selectedAd?.schedule_items?.[0]?.end_time ? 
                        String(selectedAd.schedule_items[0].end_time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2') : 
                        "22:00"} 
                    />
                  </div>
                  <div className="col-md-6">
                    <Input 
                      label={t('station_settings.ads.regie.modal.start_date')} 
                      name="start_date" 
                      type="date" 
                      defaultValue={selectedAd?.schedule_items?.[0]?.start_date || ''}
                    />
                  </div>
                  <div className="col-md-6">
                    <Input 
                      label={t('station_settings.ads.regie.modal.end_date')} 
                      name="end_date" 
                      type="date" 
                      defaultValue={selectedAd?.schedule_items?.[0]?.end_date || ''}
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <label className="form-label small fw-bold text-muted text-uppercase ls-1">{t('station_settings.ads.regie.modal.days')}</label>
                    <div className="d-flex flex-wrap gap-2">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => {
                        const dayNum = idx + 1;
                        const daysString = selectedAd?.schedule_items?.[0]?.days || '';
                        const isChecked = daysString ? 
                          daysString.split(',').includes(String(dayNum)) : 
                          true;
                        
                        return (
                          <div key={day} className="position-relative">
                            <input 
                              className="btn-check" 
                              type="checkbox" 
                              name={`day_${idx}`} 
                              id={`day_${idx}`} 
                              defaultChecked={isChecked} 
                            />
                            <label 
                              className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" 
                              htmlFor={`day_${idx}`}
                              style={{ minWidth: '55px' }}
                            >
                              {day}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-3 border-top d-flex justify-content-end gap-2">
            <Button variant="light" onClick={() => setIsAdModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" loading={adMutation.isPending}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StationSettings;
