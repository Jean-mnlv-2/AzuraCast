import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  PieChart,
  Calendar,
  TrendingUp,
  History,
  User,
  ChevronRight,
  CreditCard,
  BarChart3
} from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';

interface BillingStats {
  recent_transactions: Array<{
    id: number;
    user: string;
    amount: number;
    status: string;
    date: string;
  }>;
  plans_popularity: Array<{
    name: string;
    count: number;
  }>;
}

const BillingDashboard: React.FC = () => {
  const { data: billing, isLoading } = useQuery<BillingStats>({
    queryKey: ['admin-billing'],
    queryFn: async () => {
      const response = await api.get('/settings/admin/billing/');
      return response.data;
    },
  });

  if (isLoading) return <div>Chargement de la facturation...</div>;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">Billing & Revenue</h1>
          <p className="text-muted-soft">Gestion des abonnements et flux financiers</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary-soft text-primary rounded-3 d-flex align-items-center gap-2">
            <Calendar size={18} />
            Rapports Mensuels
          </button>
          <button className="btn btn-danger text-white rounded-3 d-flex align-items-center gap-2">
            <DollarSign size={18} />
            Gérer les Plans
          </button>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {/* Plans Popularity */}
        <div className="col-lg-4">
          <Card title="Répartition des Plans" icon={<PieChart size={20} className="text-primary" />}>
            <div className="py-3">
              {billing?.plans_popularity.map((plan, i) => (
                <div key={i} className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small fw-bold text-main">{plan.name}</span>
                    <span className="small fw-800 text-primary">{plan.count} abonnés</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div className="progress-bar bg-primary rounded-pill" style={{ width: `${(plan.count / 10) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-light-soft rounded-3 border border-white mt-2">
              <p className="smaller text-muted-soft mb-0 d-flex align-items-center gap-2">
                <TrendingUp size={14} className="text-success" />
                Le plan Business a augmenté de 12% ce mois-ci à Douala.
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="col-lg-8">
          <Card title="Transactions Récentes" icon={<History size={20} className="text-danger" />}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="small text-muted border-0">
                    <th className="border-0 px-0">UTILISATEUR</th>
                    <th className="border-0">MONTANT</th>
                    <th className="border-0">STATUT</th>
                    <th className="border-0">DATE</th>
                    <th className="border-0 text-end">RÉF.</th>
                  </tr>
                </thead>
                <tbody>
                  {billing?.recent_transactions.map((txn) => (
                    <tr key={txn.id} className="border-0">
                      <td className="px-0 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light p-2 rounded-circle">
                            <User size={14} />
                          </div>
                          <span className="small fw-bold text-main">{txn.user}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="fw-800 text-main">{new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(txn.amount)}</span>
                      </td>
                      <td className="py-3">
                        <span className={`badge rounded-pill px-3 py-1 ${txn.status === 'completed' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`}>
                          {txn.status === 'completed' ? 'Validé' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3 small text-muted">
                        {new Date(txn.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 text-end">
                        <button className="btn btn-link text-muted p-0"><ChevronRight size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-4">
              <button className="btn btn-light-soft btn-sm text-primary fw-bold rounded-pill px-4">Voir tout l'historique</button>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Gateways Info */}
      <div className="row g-4">
        <div className="col-md-4">
          <Card className="border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-orange-soft p-3 rounded-3">
                <CreditCard className="text-warning" size={24} />
              </div>
              <div>
                <h6 className="fw-800 text-main mb-0">Mobile Money</h6>
                <p className="smaller text-muted-soft mb-0">Orange/MTN Cameroun Actif</p>
              </div>
              <div className="ms-auto">
                <span className="badge bg-success-soft text-success rounded-pill">Connecté</span>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary-soft p-3 rounded-3">
                <DollarSign className="text-primary" size={24} />
              </div>
              <div>
                <h6 className="fw-800 text-main mb-0">Stripe Payments</h6>
                <p className="smaller text-muted-soft mb-0">Cartes Bancaires / Apple Pay</p>
              </div>
              <div className="ms-auto">
                <span className="badge bg-success-soft text-success rounded-pill">Connecté</span>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="border-0 shadow-sm bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-danger-soft p-3 rounded-3">
                <BarChart3 className="text-danger" size={24} />
              </div>
              <div>
                <h6 className="fw-800 text-main mb-0">Kill Switch</h6>
                <p className="smaller text-muted-soft mb-0">Suspension auto. active</p>
              </div>
              <div className="ms-auto">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
