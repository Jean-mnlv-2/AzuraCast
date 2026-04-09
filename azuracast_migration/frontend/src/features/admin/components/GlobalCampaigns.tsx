import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  Target, 
  BarChart, 
  Edit2,
  Trash2
} from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';

interface GlobalCampaign {
  id: number;
  name: string;
  advertiser_name: string;
  total_budget: number;
  is_active: boolean;
  play_interval: number;
  start_date: string;
  end_date: string;
  media_url: string;
}

const GlobalCampaigns: React.FC = () => {

  const { data: campaigns, isLoading } = useQuery<GlobalCampaign[]>({
    queryKey: ['admin-global-campaigns'],
    queryFn: async () => {
      const response = await api.get('/stations/global-campaigns/');
      return response.data;
    },
  });

  if (isLoading) return <div>Chargement de la régie publicitaire...</div>;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">Régie Publicitaire</h1>
          <p className="text-muted-soft">Gestion des campagnes globales sur tout le réseau BantuWave</p>
        </div>
        <button className="btn btn-danger text-white rounded-3 d-flex align-items-center gap-2 px-4 py-2 shadow-sm">
          <Plus size={20} />
          Nouvelle Campagne
        </button>
      </div>

      <div className="row g-4">
        {campaigns?.map((campaign) => (
          <div key={campaign.id} className="col-lg-6">
            <Card className="h-100 border-0 shadow-sm hover-translate-up transition-all">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger-soft text-danger p-3 rounded-3">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h5 className="fw-800 text-main mb-0">{campaign.name}</h5>
                    <span className="smaller text-muted-soft">{campaign.advertiser_name}</span>
                  </div>
                </div>
                <span className={`badge rounded-pill px-3 py-1 ${campaign.is_active ? 'bg-success-soft text-success' : 'bg-secondary-soft text-muted'}`}>
                  {campaign.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light-soft rounded-3 border border-white">
                    <div className="smaller text-muted-soft mb-1 d-flex align-items-center gap-2">
                      <Target size={14} /> Diffusion
                    </div>
                    <div className="fw-bold text-main">Toutes les 15 min</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light-soft rounded-3 border border-white">
                    <div className="smaller text-muted-soft mb-1 d-flex align-items-center gap-2">
                      <Calendar size={14} /> Période
                    </div>
                    <div className="fw-bold text-main small">
                      {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-3 border-top border-light">
                <div className="d-flex align-items-center gap-2">
                  <BarChart size={18} className="text-primary" />
                  <span className="small fw-bold text-main">12.4k Impressions</span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-icon btn-light-soft text-primary"><Edit2 size={16} /></button>
                  <button className="btn btn-icon btn-light-soft text-danger"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          </div>
        ))}

        {campaigns?.length === 0 && (
          <div className="col-12">
            <div className="text-center py-5 bg-white rounded-4 shadow-sm">
              <Megaphone size={48} className="text-muted-soft mb-3 opacity-20" />
              <h5 className="text-muted-soft fw-700">Aucune campagne globale active</h5>
              <p className="smaller text-muted-soft">Commencez par créer une campagne pour diffuser sur toutes les radios.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalCampaigns;
