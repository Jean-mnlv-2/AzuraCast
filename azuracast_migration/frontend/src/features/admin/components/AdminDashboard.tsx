import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  Radio, 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Users, 
  Zap, 
  Server,
  ArrowUpRight
} from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';

interface AdminStats {
  stations: {
    total: number;
    active: number;
    suspended: number;
  };
  server: {
    cpu: number;
    ram: number;
    disk: number;
    docker_cpu: number;
    docker_ram: number;
  };
  bandwidth: {
    total_listeners: number;
    outgoing_mbps: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-global-stats'],
    queryFn: async () => {
      const response = await api.get('/settings/admin/stats/');
      return response.data;
    },
    refetchInterval: 10000,
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
      <div className="mb-5">
        <h1 className="fw-800 text-main mb-1">Vue d'Ensemble</h1>
        <p className="text-muted-soft">État global du serveur et des stations BantuWave</p>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <Card className="h-100 border-0 shadow-sm bg-primary-soft">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="bg-primary text-white p-2 rounded-3 shadow-sm">
                <Radio size={20} />
              </div>
              <span className="badge bg-white text-primary rounded-pill px-2 py-1 small fw-bold">Stations</span>
            </div>
            <h2 className="fw-800 text-main mb-1">{stats?.stations.total}</h2>
            <div className="d-flex align-items-center gap-2 small">
              <span className="text-success fw-bold">{stats?.stations.active} Actives</span>
              <span className="text-muted-soft">•</span>
              <span className="text-danger fw-bold">{stats?.stations.suspended} Suspendues</span>
            </div>
          </Card>
        </div>

        <div className="col-md-3">
          <Card className="h-100 border-0 shadow-sm bg-danger-soft">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="bg-danger text-white p-2 rounded-3 shadow-sm">
                <Users size={20} />
              </div>
              <span className="badge bg-white text-danger rounded-pill px-2 py-1 small fw-bold">Audience</span>
            </div>
            <h2 className="fw-800 text-main mb-1">{stats?.bandwidth.total_listeners}</h2>
            <p className="text-muted-soft small mb-0 d-flex align-items-center gap-1">
              Auditeurs connectés en direct <ArrowUpRight size={14} />
            </p>
          </Card>
        </div>

        <div className="col-md-3">
          <Card className="h-100 border-0 shadow-sm bg-info-soft">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="bg-info text-white p-2 rounded-3 shadow-sm">
                <Zap size={20} />
              </div>
              <span className="badge bg-white text-info rounded-pill px-2 py-1 small fw-bold">Bande Passante</span>
            </div>
            <h2 className="fw-800 text-main mb-1">{stats?.bandwidth.outgoing_mbps} <small className="fs-6">Mbps</small></h2>
            <p className="text-muted-soft small mb-0">Débit sortant estimé</p>
          </Card>
        </div>

        <div className="col-md-3">
          <Card className="h-100 border-0 shadow-sm bg-warning-soft">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="bg-warning text-white p-2 rounded-3 shadow-sm">
                <Activity size={20} />
              </div>
              <span className="badge bg-white text-warning rounded-pill px-2 py-1 small fw-bold">Serveur</span>
            </div>
            <h2 className="fw-800 text-main mb-1">{stats?.server.cpu}%</h2>
            <p className="text-muted-soft small mb-0">Utilisation CPU globale</p>
          </Card>
        </div>
      </div>

      {/* Row 2: Detailed Server Health */}
      <div className="row g-4">
        <div className="col-lg-8">
          <Card title="Santé du Serveur & Docker" icon={<Server size={20} className="text-primary" />}>
            <div className="row g-4 py-2">
              <div className="col-md-6">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold text-main d-flex align-items-center gap-2"><Cpu size={16} /> CPU (Conteneurs Docker)</span>
                    <span className="small fw-800 text-primary">{stats?.server.docker_cpu}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-primary rounded-pill" style={{ width: `${stats?.server.docker_cpu}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold text-main d-flex align-items-center gap-2"><Database size={16} /> RAM (Conteneurs Docker)</span>
                    <span className="small fw-800 text-info">{stats?.server.docker_ram}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-info rounded-pill" style={{ width: `${stats?.server.docker_ram}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold text-main d-flex align-items-center gap-2"><HardDrive size={16} /> Espace Disque</span>
                    <span className="small fw-800 text-warning">{stats?.server.disk}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-warning rounded-pill" style={{ width: `${stats?.server.disk}%` }}></div>
                  </div>
                </div>
                <div className="p-3 bg-light-soft rounded-3 border border-white">
                  <p className="smaller text-muted-soft mb-0">
                    Les statistiques Docker incluent l'ensemble des instances Liquidsoap et Icecast actives.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-lg-4">
          <Card title="Ressources" icon={<Activity size={20} className="text-danger" />}>
            <ul className="list-group list-group-flush">
              <li className="list-group-item px-0 py-3 bg-transparent border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center">
                <span className="small text-muted-soft">Stations Actives</span>
                <span className="fw-bold text-main">{stats?.stations.active}</span>
              </li>
              <li className="list-group-item px-0 py-3 bg-transparent border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center">
                <span className="small text-muted-soft">Listeners / Mbps</span>
                <span className="fw-bold text-main">{stats?.bandwidth.total_listeners} / {stats?.bandwidth.outgoing_mbps}</span>
              </li>
              <li className="list-group-item px-0 py-3 bg-transparent border-0 d-flex justify-content-between align-items-center">
                <span className="small text-muted-soft">Statut Docker</span>
                <span className="badge bg-success-soft text-success fw-bold rounded-pill">OPÉRATIONNEL</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
