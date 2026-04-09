import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';

interface AuditLogEntry {
  id: number;
  object_repr: string;
  action: number;
  timestamp: string;
  user_email: string;
  changes?: string;
}

const AuditLogs: React.FC = () => {
  const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const response = await api.get('/settings/admin/audit/');
      return response.data;
    },
  });

  const getActionBadge = (action: number) => {
    switch (action) {
      case 0: return <span className="badge bg-success-soft text-success rounded-pill px-3 py-1">CRÉATION</span>;
      case 1: return <span className="badge bg-primary-soft text-primary rounded-pill px-3 py-1">MODIFICATION</span>;
      case 2: return <span className="badge bg-danger-soft text-danger rounded-pill px-3 py-1">SUPPRESSION</span>;
      default: return null;
    }
  };

  const getActionIcon = (action: number) => {
    switch (action) {
      case 0: return <CheckCircle2 className="text-success" size={18} />;
      case 1: return <Info className="text-primary" size={18} />;
      case 2: return <AlertCircle className="text-danger" size={18} />;
      default: return null;
    }
  };

  if (isLoading) return <div>Chargement des journaux d'audit...</div>;

  return (
    <div className="container-fluid px-0">
      <div className="mb-5">
        <h1 className="fw-800 text-main mb-1">Audit Logs</h1>
        <p className="text-muted-soft">Historique complet des actions administratives sur BantuWave</p>
      </div>

      <div className="row">
        <div className="col-12">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="small text-muted border-0">
                    <th className="px-4 py-3 border-0">TIMESTAMP</th>
                    <th className="py-3 border-0">UTILISATEUR</th>
                    <th className="py-3 border-0">ACTION</th>
                    <th className="py-3 border-0">OBJET</th>
                    <th className="px-4 py-3 border-0">MODIFICATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.map((log) => (
                    <tr key={log.id} className="border-0">
                      <td className="px-4 py-4 small text-muted">
                        <div className="d-flex align-items-center gap-2">
                          <Clock size={14} />
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light p-2 rounded-circle">
                            <User size={14} />
                          </div>
                          <span className="small fw-bold text-main">{log.user_email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-main small">{log.object_repr}</span>
                      </td>
                      <td className="px-4">
                        <div 
                          className="bg-light-soft p-2 rounded small text-muted-soft text-truncate font-monospace" 
                          style={{ maxWidth: '300px' }}
                          title={typeof log.changes === 'object' ? JSON.stringify(log.changes) : log.changes}
                        >
                          {typeof log.changes === 'object' ? JSON.stringify(log.changes) : (log.changes || 'N/A')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
