import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  Cpu, 
  Users, 
  Zap, 
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';

interface AdminStats {
  business: {
    mrr: number;
    total_revenue: number;
    active_subscriptions: number;
    churn_rate: number;
    currency: string;
  };
  stations: {
    total: number;
    active: number;
    suspended: number;
    trial: number;
  };
  server: {
    cpu: number;
    ram: number;
    disk: number;
    load_avg: [number, number, number];
  };
  bandwidth: {
    total_listeners: number;
    outgoing_gbps: number;
  };
  alerts: Array<{
    level: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-global-stats'],
    queryFn: async () => {
      const response = await api.get('/settings/admin/stats/');
      return response.data;
    },
    refetchInterval: 30000,
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
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">BantuWave Super Admin</h1>
          <p className="text-muted-soft">Business & Infrastructure Control Center • Douala Node</p>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-success-soft text-success p-2 rounded-3 d-flex align-items-center gap-2">
            <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
            Système Opérationnel
          </span>
        </div>
      </div>

      {/* KPIs Business Section */}
      <h3 className="fw-bold mb-4 d-flex align-items-center gap-2">
        <DollarSign size={24} className="text-main" />
        Business KPIs (Monétisation)
      </h3>
      <div className="row g-4 mb-5">
        <div className="col-lg-4">
          <Card className="border-0 shadow-sm h-100 overflow-hidden position-relative">
            <div className="p-1">
              <div className="text-muted small fw-bold text-uppercase mb-2">Chiffre d'Affaires Mensuel (MRR)</div>
              <div className="d-flex align-items-center gap-3">
                <div className="h1 fw-900 mb-0 text-main">
                  {stats?.business.mrr.toLocaleString()} {stats?.business.currency}
                </div>
                <div className="badge bg-success-soft text-success rounded-pill px-2 py-1 small">
                  <TrendingUp size={12} className="me-1" /> +12%
                </div>
              </div>
            </div>
            <div className="position-absolute bottom-0 end-0 opacity-10 p-3">
              <DollarSign size={64} />
            </div>
          </Card>
        </div>
        <div className="col-lg-4">
          <Card className="border-0 shadow-sm h-100 overflow-hidden position-relative">
            <div className="p-1">
              <div className="text-muted small fw-bold text-uppercase mb-2">Abonnés Actifs</div>
              <div className="h1 fw-900 mb-0 text-main">{stats?.business.active_subscriptions}</div>
            </div>
            <div className="position-absolute bottom-0 end-0 opacity-10 p-3">
              <Users size={64} />
            </div>
          </Card>
        </div>
        <div className="col-lg-4">
          <Card className="border-0 shadow-sm h-100 overflow-hidden position-relative">
            <div className="p-1">
              <div className="text-muted small fw-bold text-uppercase mb-2">Taux de Désabonnement (Churn)</div>
              <div className="h1 fw-900 mb-0 text-danger">{stats?.business.churn_rate}%</div>
            </div>
            <div className="position-absolute bottom-0 end-0 opacity-10 p-3">
              <Zap size={64} />
            </div>
          </Card>
        </div>
      </div>

      {/* KPIs Technical Section */}
      <h3 className="fw-bold mb-4 d-flex align-items-center gap-2">
        <Cpu size={24} className="text-main" />
        Infrastructure & Audience
      </h3>
      <div className="row g-4 mb-5">
        <div className="col-lg-3">
          <Card className="border-0 shadow-sm text-center py-4">
            <div className="text-muted small fw-bold text-uppercase mb-3">Charge CPU Globale</div>
            <div className={`h2 fw-900 mb-3 ${(stats?.server.cpu ?? 0) > 80 ? 'text-danger' : 'text-main'}`}>
              {stats?.server.cpu}%
            </div>
            <div className="progress rounded-pill" style={{ height: '8px' }}>
              <div 
                className={`progress-bar rounded-pill ${(stats?.server.cpu ?? 0) > 80 ? 'bg-danger' : 'bg-primary'}`} 
                style={{ width: `${stats?.server.cpu}%` }}
              ></div>
            </div>
          </Card>
        </div>
        <div className="col-lg-3">
          <Card className="border-0 shadow-sm text-center py-4">
            <div className="text-muted small fw-bold text-uppercase mb-3">Mémoire RAM</div>
            <div className="h2 fw-900 mb-3 text-main">{stats?.server.ram}%</div>
            <div className="progress rounded-pill" style={{ height: '8px' }}>
              <div className="progress-bar bg-info rounded-pill" style={{ width: `${stats?.server.ram}%` }}></div>
            </div>
          </Card>
        </div>
        <div className="col-lg-3">
          <Card className="border-0 shadow-sm text-center py-4">
            <div className="text-muted small fw-bold text-uppercase mb-3">Auditeurs Uniques</div>
            <div className="h2 fw-900 mb-3 text-main">{stats?.bandwidth.total_listeners}</div>
            <div className="small text-muted">Sur tout le réseau</div>
          </Card>
        </div>
        <div className="col-lg-3">
          <Card className="border-0 shadow-sm text-center py-4">
            <div className="text-muted small fw-bold text-uppercase mb-3">Bande Passante (Gbps)</div>
            <div className="h2 fw-900 mb-3 text-main">{stats?.bandwidth.outgoing_gbps} Gbps</div>
            <div className="small text-muted">Sortie Temps Réel</div>
          </Card>
        </div>
      </div>

      {/* Alerts Section */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="mb-5">
          <h3 className="fw-bold mb-4 d-flex align-items-center gap-2 text-danger">
            <AlertTriangle size={24} />
            Alertes Critiques
          </h3>
          <div className="row">
            <div className="col-12">
              {stats.alerts.map((alert, i) => (
                <div key={i} className={`alert alert-${alert.level === 'critical' ? 'danger' : 'warning'} d-flex justify-content-between align-items-center gap-3 border-0 shadow-sm mb-2 py-3 px-4 rounded-4`}>
                  <div className="d-flex align-items-center gap-3">
                    <AlertTriangle size={24} />
                    <span className="fw-bold fs-5">{alert.message}</span>
                  </div>
                  <button className="btn btn-sm btn-outline-dark rounded-pill">Détails</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
