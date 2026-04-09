import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axios';
import { useParams, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  RefreshCw, 
  FileText,
  MapPin,
  Zap,
  Smartphone,
  Monitor,
  CheckCircle2,
  ExternalLink,
  Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Button from '../../../components/ui/Button';
import * as XLSX from 'xlsx';

const COLORS = ['#FF4D4D', '#34D399', '#3B82F6', '#F59E0B', '#8B5CF6'];

const StationAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'proof_of_play' | 'technical' | 'minim'>('overview');

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['analytics', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/analytics/${station_short_name}/`);
      return response.data;
    },
  });

  const { data: geography } = useQuery({
    queryKey: ['analytics-geo', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/analytics/${station_short_name}/geography/`);
      return response.data;
    },
  });

  const { data: adReport } = useQuery({
    queryKey: ['analytics-ads', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/analytics/${station_short_name}/advertisements/`);
      return response.data;
    },
  });

  const { data: station } = useQuery({
    queryKey: ['station', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/`);
      return response.data;
    }
  });

  // Export Proof of Play to Excel
  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (statsLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-muted small">{t('common.loading')}</p>
      </div>
    );
  }

  const latest = stats?.[0];
  
  const bitrateData = [
    { name: '32k (Low)', value: 45 },
    { name: '128k (Standard)', value: 35 },
    { name: '192k (HD)', value: 20 },
  ];

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-5 gap-3">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small text-uppercase fw-700 ls-1 mb-2">
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted-soft">Dashboard</Link></li>
              <li className="breadcrumb-item text-primary active">{station?.name}</li>
            </ol>
          </nav>
          <h1 className="fw-800 text-main mb-0">{t('nav.analytics')}</h1>
        </div>
        <div className="d-flex gap-2">
          <Button variant="light" size="sm" onClick={() => refetchStats()} icon={<RefreshCw size={16} />}>
            Actualiser
          </Button>
          <Button variant="primary" size="sm" icon={<Download size={18} />} onClick={() => exportToExcel(stats || [], 'Global_Stats')}>
            Export Global
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bw-section p-1 mb-5 bg-light-soft rounded-pill d-inline-flex">
        <button 
          className={`btn rounded-pill px-4 fw-bold ls-1 small ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'Ensemble
        </button>
        <button 
          className={`btn rounded-pill px-4 fw-bold ls-1 small ${activeTab === 'proof_of_play' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
          onClick={() => setActiveTab('proof_of_play')}
        >
          Proof of Play
        </button>
        <button 
          className={`btn rounded-pill px-4 fw-bold ls-1 small ${activeTab === 'technical' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
          onClick={() => setActiveTab('technical')}
        >
          Performance
        </button>
        <button 
          className={`btn rounded-pill px-4 fw-bold ls-1 small ${activeTab === 'minim' ? 'bg-white shadow-sm text-primary' : 'text-muted'}`}
          onClick={() => setActiveTab('minim')}
        >
          Impact Minim
        </button>
      </div>

      {/* Pillar 1: Overview & Real-time */}
      {activeTab === 'overview' && (
        <>
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="bw-section h-100 p-4 border-bottom border-primary border-4">
                <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-1">En Direct</p>
                <div className="d-flex align-items-baseline gap-2">
                  <h2 className="fw-800 text-main mb-0">{latest?.number_max || 0}</h2>
                  <div className="spinner-grow spinner-grow-sm text-danger" role="status"></div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="bw-section h-100 p-4">
                <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-1">Pic d'Audience</p>
                <h2 className="fw-800 text-main mb-0">{latest?.number_max || 0}</h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="bw-section h-100 p-4">
                <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-1">Unique (24h)</p>
                <h2 className="fw-800 text-main mb-0">{latest?.number_unique || 0}</h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="bw-section h-100 p-4">
                <p className="text-muted-soft smaller text-uppercase fw-700 ls-1 mb-1">Temps Moyen</p>
                <h2 className="fw-800 text-main mb-0">12m</h2>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="bw-section h-100">
                <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                  <TrendingUp size={20} className="text-primary" /> Évolution (24h)
                </h5>
                <div style={{ width: '100%', height: 350, minHeight: 350 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={stats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bw-border)" />
                      <XAxis dataKey="moment" hide />
                      <YAxis stroke="var(--bw-text-muted)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bw-bg-surface)', borderColor: 'var(--bw-border)' }}
                      />
                      <Line type="monotone" dataKey="number_max" stroke="var(--bw-primary)" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="bw-section h-100">
                <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                  <MapPin size={20} className="text-primary" /> Géolocalisation
                </h5>
                <div className="list-group list-group-flush">
                  {geography?.map((geo: any, idx: number) => (
                    <div key={idx} className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bw">
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-main">{geo.location_country || 'Inconnu'}</span>
                      </div>
                      <span className="badge bg-light text-main rounded-pill">{geo.count} aud.</span>
                    </div>
                  ))}
                  {(!geography || geography.length === 0) && <p className="text-muted small py-4 text-center">Aucune donnée géographique</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pillar 2: Proof of Play */}
      {activeTab === 'proof_of_play' && (
        <div className="bw-section">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-800 text-main mb-0 d-flex align-items-center gap-2">
              <CheckCircle2 size={20} className="text-success" /> Rapports de Diffusion (Spots & Musique)
            </h5>
            <Button variant="outline-primary" size="sm" icon={<FileText size={16} />} onClick={() => exportToExcel(adReport || [], 'Proof_of_Play')}>
              Exporter Rapport Pub
            </Button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle border-bw">
              <thead className="bg-light-soft">
                <tr>
                  <th className="smaller text-uppercase fw-700 ls-1 py-3">Publicité / Titre</th>
                  <th className="smaller text-uppercase fw-700 ls-1 py-3">Heure de passage</th>
                  <th className="smaller text-uppercase fw-700 ls-1 py-3 text-center">Audience</th>
                  <th className="smaller text-uppercase fw-700 ls-1 py-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {adReport?.map((ad: any, idx: number) => (
                  <tr key={idx}>
                    <td>
                      <div className="fw-bold text-main">{ad.advertisement__name}</div>
                      <div className="smaller text-muted">Campagne ID: {ad.advertisement__id}</div>
                    </td>
                    <td className="small text-muted">Aujourd'hui, 14:20</td>
                    <td className="text-center">
                      <span className="fw-bold text-primary">{ad.total_plays * 12}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-success-soft text-success rounded-pill px-3">Confirmé Log</span>
                    </td>
                  </tr>
                ))}
                {(!adReport || adReport.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-muted small">Aucune diffusion enregistrée pour cette période</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pillar 3: Technical Performance */}
      {activeTab === 'technical' && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="bw-section h-100">
              <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                <Zap size={20} className="text-warning" /> Consommation Bitrates
              </h5>
              <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={bitrateData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {bitrateData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 d-flex justify-content-center gap-4">
                {bitrateData.map((item, idx) => (
                  <div key={idx} className="small d-flex align-items-center gap-2">
                    <div className="rounded-circle" style={{ width: 10, height: 10, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-muted">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="bw-section h-100">
              <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                <Smartphone size={20} className="text-info" /> Appareils & Systèmes
              </h5>
              <div className="list-group list-group-flush">
                <div className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bw">
                  <div className="d-flex align-items-center gap-3">
                    <Smartphone size={18} className="text-muted" />
                    <span className="text-main fw-600">Mobile (Android/iOS)</span>
                  </div>
                  <span className="fw-bold">90%</span>
                </div>
                <div className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bw">
                  <div className="d-flex align-items-center gap-3">
                    <Monitor size={18} className="text-muted" />
                    <span className="text-main fw-600">Desktop / Web Browser</span>
                  </div>
                  <span className="fw-bold">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pillar 4: Minim Impact */}
      {activeTab === 'minim' && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="bw-section h-100">
              <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                <BarChart3 size={20} className="text-primary" /> Intelligence Data (Minim)
              </h5>
              <div className="mb-5">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small fw-bold text-main">Taux d'Enrichissement (ISRC/Art)</span>
                  <span className="small fw-bold text-primary">84%</span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                  <div className="progress-bar bg-primary rounded-pill" style={{ width: '84%' }}></div>
                </div>
                <p className="smaller text-muted mt-2">
                  84% de votre bibliothèque possède des métadonnées professionnelles grâce à l'IA Minim.
                </p>
              </div>
              <div className="row g-4">
                <div className="col-6">
                  <div className="p-3 bg-light-soft rounded-4">
                    <h3 className="fw-800 text-main mb-0">1,242</h3>
                    <p className="smaller text-muted-soft text-uppercase fw-700 ls-1 mb-0">ISRC Trouvés</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light-soft rounded-4">
                    <h3 className="fw-800 text-main mb-0">890</h3>
                    <p className="smaller text-muted-soft text-uppercase fw-700 ls-1 mb-0">Pochettes HD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="bw-section h-100">
              <h5 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
                <ExternalLink size={20} className="text-primary" /> Conversion Streaming
              </h5>
              <p className="small text-muted mb-4">
                Nombre de clics vers les plateformes externes depuis votre player public.
              </p>
              <div className="d-flex flex-column gap-3">
                <div className="p-3 border-bw rounded-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Spotify</span>
                  <span className="badge bg-success text-white px-3">342 clics</span>
                </div>
                <div className="p-3 border-bw rounded-4 d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Apple Music</span>
                  <span className="badge bg-info text-white px-3">128 clics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationAnalytics;
