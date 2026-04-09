import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Radio, 
  Power, 
  RotateCw, 
  ShieldCheck, 
  Search
} from 'lucide-react';
import api from '../../../api/axios';
import { useAuthStore } from '../../../store/useAuthStore';

interface StationFleet {
  id: number;
  name: string;
  short_name: string;
  is_enabled: boolean;
  has_started: boolean;
  plan: string;
  storage_used_pct: number;
  listeners: number;
}

const FleetManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const { data: stations, isLoading } = useQuery<StationFleet[]>({
    queryKey: ['admin-fleet'],
    queryFn: async () => {
      const response = await api.get('/settings/admin/fleet/');
      return response.data;
    },
  });

  const controlMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number, action: 'start' | 'stop' | 'restart' }) => {
      return api.post(`/stations/${id}/${action}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fleet'] });
    }
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/users/${userId}/impersonate/`);
      return response.data;
    },
    onSuccess: (data: any) => {
      setAuth(data.access, data.refresh, data.user);
      window.location.href = '/';
    }
  });

  if (isLoading) return <div>Chargement de la flotte...</div>;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">Fleet Management</h1>
          <p className="text-muted-soft">Gestion granulaire des instances radio</p>
        </div>
        <div className="position-relative">
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
          <input 
            type="text" 
            className="form-control ps-5 border-0 shadow-sm rounded-3" 
            placeholder="Rechercher une station..." 
            style={{ width: '300px' }}
          />
        </div>
      </div>

      <div className="table-responsive bg-white rounded-4 shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 border-0 small fw-bold text-muted">STATION</th>
              <th className="py-3 border-0 small fw-bold text-muted">PLAN</th>
              <th className="py-3 border-0 small fw-bold text-muted">STATUT</th>
              <th className="py-3 border-0 small fw-bold text-muted">STOCKAGE</th>
              <th className="py-3 border-0 small fw-bold text-muted">AUDIENCE</th>
              <th className="px-4 py-3 border-0 small fw-bold text-muted text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {stations?.map((station) => (
              <tr key={station.id}>
                <td className="px-4 py-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`p-2 rounded-3 ${station.is_enabled ? 'bg-primary-soft text-primary' : 'bg-secondary-soft text-muted'}`}>
                      <Radio size={20} />
                    </div>
                    <div>
                      <div className="fw-bold text-main">{station.name}</div>
                      <div className="smaller text-muted">/{station.short_name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge rounded-pill px-3 py-2 ${
                    station.plan === 'Business' ? 'bg-danger-soft text-danger' : 
                    station.plan === 'Pro' ? 'bg-primary-soft text-primary' : 'bg-secondary-soft text-muted'
                  }`}>
                    {station.plan}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className={`rounded-circle ${station.has_started ? 'bg-success' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></div>
                    <span className="small fw-bold">{station.has_started ? 'En ligne' : 'Arrêtée'}</span>
                  </div>
                </td>
                <td style={{ width: '150px' }}>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="progress-bar bg-info" style={{ width: `${station.storage_used_pct}%` }}></div>
                  </div>
                  <div className="smaller text-muted mt-1">{station.storage_used_pct}% utilisé</div>
                </td>
                <td>
                  <div className="fw-bold">{station.listeners}</div>
                  <div className="smaller text-muted">auditeurs</div>
                </td>
                <td className="px-4 text-end">
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      className="btn btn-icon btn-light-soft text-primary" 
                      title="Impersonnaliser"
                      onClick={() => impersonateMutation.mutate(station.id)} 
                    >
                      <ShieldCheck size={18} />
                    </button>
                    <button 
                      className="btn btn-icon btn-light-soft text-warning" 
                      title="Redémarrer"
                      onClick={() => controlMutation.mutate({ id: station.id, action: 'restart' })}
                    >
                      <RotateCw size={18} />
                    </button>
                    <button 
                      className={`btn btn-icon ${station.has_started ? 'btn-light-soft text-danger' : 'btn-light-soft text-success'}`}
                      title={station.has_started ? 'Arrêter' : 'Démarrer'}
                      onClick={() => controlMutation.mutate({ id: station.id, action: station.has_started ? 'stop' : 'restart' })}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FleetManagement;
