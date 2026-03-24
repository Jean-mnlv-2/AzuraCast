import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Save, Globe, Palette, Mail, Zap } from 'lucide-react';
import axios from '../../../api/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

type SettingsRecord = Record<string, unknown>;

const GlobalSettings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<SettingsRecord>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const response = await axios.get('/settings/');
      return response.data as SettingsRecord;
    },
  });

  React.useEffect(() => {
    if (settings && typeof settings === 'object') {
      setForm({ ...settings });
    }
  }, [settings]);

  const patch = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const mutation = useMutation({
    mutationFn: (payload: SettingsRecord) => axios.post('/settings/', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['global-settings'] });
    },
  });

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
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">{t('admin.settings.title')}</h1>
          <p className="text-muted mb-0">{t('admin.settings.subtitle')}</p>
        </div>
        <Button 
          variant="danger" 
          icon={<Save size={20} />}
          loading={mutation.isPending}
          onClick={() => mutation.mutate(form)}
        >
          {t('common.save_changes')}
        </Button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <Card title={t('admin.settings.general')} icon={<Globe size={20} className="text-danger" />}>
            <div className="d-grid gap-3">
              <Input
                label={t('admin.settings.base_url')}
                value={(form.base_url as string) ?? ''}
                onChange={(e) => patch('base_url', e.target.value || null)}
              />
              <Input
                label={t('admin.settings.instance_name')}
                value={(form.instance_name as string) ?? ''}
                onChange={(e) => patch('instance_name', e.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-6">
          <Card title={t('admin.settings.branding')} icon={<Palette size={20} className="text-danger" />}>
            <div className="d-grid gap-3">
              <Input
                label={t('admin.settings.public_theme')}
                value={(form.public_theme as string) ?? ''}
                onChange={(e) => patch('public_theme', e.target.value)}
              />
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={!!form.hide_album_art}
                  onChange={(e) => patch('hide_album_art', e.target.checked)}
                />
                <label className="form-check-label">{t('admin.settings.hide_album_art')}</label>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-6">
          <Card title={t('admin.settings.mail')} icon={<Mail size={20} className="text-danger" />}>
            <div className="row g-3">
              <div className="col-md-6">
                <Input
                  label={t('admin.settings.smtp_host')}
                  value={(form.mail_smtp_host as string) ?? ''}
                  onChange={(e) => patch('mail_smtp_host', e.target.value || null)}
                />
              </div>
              <div className="col-md-3">
                <Input
                  label={t('admin.settings.smtp_port')}
                  type="number"
                  value={form.mail_smtp_port != null ? String(form.mail_smtp_port) : ''}
                  onChange={(e) => patch('mail_smtp_port', e.target.value === '' ? null : Number(e.target.value))}
                />
              </div>
              <div className="col-md-3">
                <Input
                  label={t('admin.settings.smtp_secure')}
                  value={(form.mail_smtp_secure as string) ?? ''}
                  onChange={(e) => patch('mail_smtp_secure', e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 col-xl-6">
          <Card title={t('admin.settings.external_services')} icon={<Zap size={20} className="text-danger" />}>
            <div className="d-grid gap-3">
              <Input
                label={t('admin.settings.last_fm_api_key')}
                value={(form.last_fm_api_key as string) ?? ''}
                onChange={(e) => patch('last_fm_api_key', e.target.value || null)}
              />
              <Input
                label={t('admin.settings.geolite_license_key')}
                value={(form.geolite_license_key as string) ?? ''}
                onChange={(e) => patch('geolite_license_key', e.target.value || null)}
              />
              <div className="small text-muted mt-1">
                {t('admin.settings.geolite_help')}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
