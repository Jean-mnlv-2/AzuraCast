import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Music, 
  Mic2, 
  Play, 
  Download, 
  Search,
  Filter,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import Card from '../../../components/ui/Card';

interface GlobalMedia {
  id: number;
  song: {
    title: string;
    artist: string;
    length: number;
  };
  category: string;
  is_public: boolean;
}

const GlobalLibrary: React.FC = () => {

  const { data: media } = useQuery<GlobalMedia[]>({
    queryKey: ['admin-global-library'],
    queryFn: async () => {
      return [
        { id: 1, song: { title: 'Jingle Matinal', artist: 'BantuWave', length: 15 }, category: 'Jingles', is_public: true },
        { id: 2, song: { title: 'Transition Afrobeat', artist: 'Studio Douala', length: 30 }, category: 'Tapis Sonores', is_public: true },
        { id: 3, song: { title: 'Publicité Standard', artist: 'Marketing', length: 20 }, category: 'Publicité', is_public: true },
      ];
    },
  });

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="fw-800 text-main mb-1">Bibliothèque Globale</h1>
          <p className="text-muted-soft">Contenu partagé mis à disposition de toutes les stations</p>
        </div>
        <div className="d-flex gap-2">
          <div className="position-relative">
            <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
            <input type="text" className="form-control ps-5 border-0 shadow-sm rounded-3" placeholder="Rechercher un média..." />
          </div>
          <button className="btn btn-danger text-white rounded-3 px-4">Uploader</button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-3">
          <Card title="Catégories" icon={<Filter size={18} />}>
            <div className="list-group list-group-flush">
              <button className="list-group-item list-group-item-action border-0 rounded-3 active bg-danger text-white mb-1 d-flex justify-content-between">
                <span>Tous les médias</span>
                <span className="badge bg-white text-danger rounded-pill">42</span>
              </button>
              <button className="list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex justify-content-between">
                <span>Jingles</span>
                <span className="badge bg-light text-muted rounded-pill">12</span>
              </button>
              <button className="list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex justify-content-between">
                <span>Tapis Sonores</span>
                <span className="badge bg-light text-muted rounded-pill">18</span>
              </button>
              <button className="list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex justify-content-between">
                <span>Musique Libre</span>
                <span className="badge bg-light text-muted rounded-pill">12</span>
              </button>
            </div>
          </Card>
        </div>

        <div className="col-lg-9">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="small text-muted border-0">
                  <th className="px-4 py-3 border-0">TITRE</th>
                  <th className="py-3 border-0">CATÉGORIE</th>
                  <th className="py-3 border-0">DURÉE</th>
                  <th className="py-3 border-0">STATUT</th>
                  <th className="px-4 py-3 border-0 text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {media?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light p-2 rounded-3">
                          {item.category === 'Jingles' ? <Mic2 size={18} className="text-danger" /> : <Music size={18} className="text-primary" />}
                        </div>
                        <div>
                          <div className="fw-bold text-main">{item.song.title}</div>
                          <div className="smaller text-muted">{item.song.artist}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-muted rounded-pill px-3 py-1">{item.category}</span>
                    </td>
                    <td className="small text-muted">{item.song.length}s</td>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-success small fw-bold">
                        <CheckCircle2 size={14} /> Public
                      </div>
                    </td>
                    <td className="px-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-icon btn-light-soft text-primary"><Play size={16} /></button>
                        <button className="btn btn-icon btn-light-soft text-main"><Download size={16} /></button>
                        <button className="btn btn-icon btn-light-soft text-muted"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLibrary;
