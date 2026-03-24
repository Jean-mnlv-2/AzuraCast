import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Calendar, 
  RefreshCw, 
  FileText, 
  Globe,
  ChevronLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '../../../components/ui/Button';

interface AnalyticsData {
  id: number;
  moment: string;
  number_min: number;
  number_max: number;
  number_avg: string;
  number_unique: number | null;
}

const StationAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();

  const { data: geoStats } = useQuery({
    queryKey: ['analytics_geo', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/analytics/${station_short_name}/geography/`);
      return response.data;
    },
  });

  const handleDownloadRoyalty = async () => {
    try {
      const response = await api.get(`/analytics/${station_short_name}/reports/royalty/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `royalty_report_${station_short_name}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Échec du téléchargement du rapport.');
    }
  };

  const { data: stats, isLoading, refetch } = useQuery<AnalyticsData[]>({
    queryKey: ['analytics', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/analytics/${station_short_name}/`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted small">{t('common.loading')}</p>
      </div>
    );
  }

  const latest = stats?.[0];

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <Link to={`/station/${station_short_name}`} className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-2">
            <ChevronLeft size={16} /> {t('station_settings.back_to_profile')}
          </Link>
          <h1 className="fw-800 text-main mb-1">{t('analytics.title')}</h1>
          <p className="text-muted small mb-0">{station_short_name}</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="light" 
            size="sm" 
            onClick={() => refetch()} 
            icon={<RefreshCw size={16} />}
          >
            {t('analytics.refresh')}
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleDownloadRoyalty}
            icon={<FileText size={18} />}
            className="shadow-sm"
          >
            {t('analytics.report_royalty')}
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="bw-section p-4 h-100">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-primary-soft p-3 rounded-4 text-primary me-3">
                <Users size={24} />
              </div>
              <h6 className="text-uppercase small ls-1 fw-bold text-muted mb-0">{t('analytics.metrics.avg')}</h6>
            </div>
            <div className="display-6 fw-800 text-main">{latest?.number_avg || '0.0'}</div>
            <div className="text-success small fw-bold mt-2 d-flex align-items-center gap-1">
              <TrendingUp size={14} /> {t('analytics.metrics.vs_yesterday', { percent: 12 })}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bw-section p-4 h-100">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-danger-soft p-3 rounded-4 text-danger me-3">
                <BarChart3 size={24} />
              </div>
              <h6 className="text-uppercase small ls-1 fw-bold text-muted mb-0">{t('analytics.metrics.peak')}</h6>
            </div>
            <div className="display-6 fw-800 text-main">{latest?.number_max || '0'}</div>
            <div className="text-muted small mt-2">{t('analytics.metrics.max_recorded')}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="bw-section p-4 h-100">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-dark bg-opacity-5 p-3 rounded-4 text-main me-3">
                <Calendar size={24} />
              </div>
              <h6 className="text-uppercase small ls-1 fw-bold text-muted mb-0">{t('analytics.metrics.unique')}</h6>
            </div>
            <div className="display-6 fw-800 text-main">{latest?.number_unique || '0'}</div>
            <div className="text-muted small mt-2">{t('analytics.metrics.last_24h')}</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Geo Stats */}
        <div className="col-lg-7">
          <div className="bw-section p-0 overflow-hidden h-100">
            <div className="p-4 border-bottom border-light-soft d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 text-main">{t('analytics.geo.title')}</h5>
              <Globe size={20} className="text-primary" />
            </div>
            <div className="p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4">{t('analytics.geo.country')}</th>
                      <th className="text-end pe-4">{t('analytics.geo.listeners')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoStats?.map((geo: any, idx: number) => (
                      <tr key={idx}>
                        <td className="ps-4 fw-600 text-main">{geo.location_country || 'Inconnu'}</td>
                        <td className="text-end pe-4">
                          <span className="badge bg-primary-soft text-primary rounded-pill px-3">{geo.count}</span>
                        </td>
                      </tr>
                    ))}
                    {(!geoStats || geoStats.length === 0) && (
                      <tr>
                        <td colSpan={2} className="text-center py-5 text-muted small">
                          {t('analytics.geo.no_data')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Retention Analysis */}
        <div className="col-lg-5">
          <div className="bw-section bg-primary text-white h-100 border-0 shadow-lg">
            <div className="p-1 d-flex flex-column h-100">
              <div className="mb-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-4 d-inline-flex mb-4">
                  <TrendingUp size={24} />
                </div>
                <h4 className="fw-800 mb-3">{t('analytics.retention.title')}</h4>
                <p className="small opacity-75 mb-0" dangerouslySetInnerHTML={{ __html: t('analytics.retention.desc', { percent: 94 }) }}>
                </p>
              </div>
              <div className="mt-auto pt-4 border-top border-white border-opacity-10">
                <div className="d-flex justify-content-between small fw-bold mb-2">
                  <span>{t('analytics.retention.loyalty')}</span>
                  <span>94%</span>
                </div>
                <div className="progress bg-white bg-opacity-20 rounded-pill" style={{ height: '8px' }}>
                  <div className="progress-bar bg-white rounded-pill" style={{ width: '94%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed History */}
      <div className="bw-section p-4">
        <h5 className="fw-bold mb-4 text-main">{t('analytics.history.title')}</h5>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats?.slice().reverse()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="moment" tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="number_avg" name="Auditeurs moyens" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StationAnalytics;
