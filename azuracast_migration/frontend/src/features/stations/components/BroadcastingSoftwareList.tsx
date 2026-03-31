import React from 'react';
import { ExternalLink, BookOpen, Star, Music, Mic2, Radio, Zap, Server } from 'lucide-react';
import Card from '../../../components/ui/Card';

const softwareList = [
  {
    name: 'Mixxx',
    type: 'Micro / Musique',
    os: 'Windows / MacOS / Linux',
    price: 'Gratuit',
    simplicity: 2,
    features: 4,
    url: 'https://mixxx.org/',
    tutorial: 'https://mixxx.org/manual/latest/',
    icon: <Music size={24} className="text-primary" />
  },
  {
    name: 'BUTT',
    type: 'Encodeur',
    os: 'Windows / MacOS / Linux',
    price: 'Gratuit',
    simplicity: 4,
    features: 2,
    url: 'https://danielnoethen.de/butt/',
    tutorial: 'https://danielnoethen.de/butt/manual.html',
    icon: <Mic2 size={24} className="text-danger" />
  },
  {
    name: 'My Radiomatisme',
    type: 'Encodeur',
    os: 'Windows',
    price: 'Gratuit',
    simplicity: 3,
    features: 4,
    url: 'http://www.myradiomatisme.com/',
    tutorial: 'http://www.myradiomatisme.com/aide',
    icon: <Radio size={24} className="text-success" />
  },
  {
    name: 'LadioCast',
    type: 'Encodeur',
    os: 'MacOS',
    price: 'Gratuit',
    simplicity: 4,
    features: 3,
    url: 'https://apps.apple.com/app/ladiocast/id413072814',
    tutorial: '#',
    icon: <Zap size={24} className="text-info" />
  },
  {
    name: 'SAM Cast',
    type: 'Micro / Musique ou Encodeur',
    os: 'Windows',
    price: 'Payant',
    simplicity: 3,
    features: 5,
    url: 'https://spacial.com/sam-cast/',
    tutorial: 'https://spacial.com/sam-cast-manual/',
    icon: <Server size={24} className="text-warning" />
  }
];

const BroadcastingSoftwareList: React.FC = () => {
  const renderStars = (count: number) => {
    return (
      <div className="d-flex gap-1 text-warning">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < count ? 'currentColor' : 'none'} className={i < count ? '' : 'text-muted-soft opacity-25'} />
        ))}
      </div>
    );
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="bw-section-header mb-2">
        <h5 className="fw-800 text-main mb-1">Logiciels de Diffusion</h5>
        <p className="text-muted small mb-0">Outils recommandés pour diffuser en direct sur BantuWave.</p>
      </div>
      
      {softwareList.map((sw) => (
        <Card key={sw.name} className="border-0 shadow-sm hover-shadow transition-all overflow-hidden">
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-light-soft rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
                  {sw.icon}
                </div>
                <div>
                  <h6 className="fw-800 text-main mb-0">{sw.name}</h6>
                  <span className="smaller text-muted-soft fw-600">{sw.type}</span>
                </div>
              </div>
              <div className="d-flex gap-1">
                <a href={sw.url} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-xs p-1 rounded-2 shadow-none border" title="Voir le site web">
                  <ExternalLink size={14} />
                </a>
                <a href={sw.tutorial} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-xs p-1 rounded-2 shadow-none border" title="Lire le tutoriel">
                  <BookOpen size={14} />
                </a>
              </div>
            </div>

            <div className="row g-2 mb-0">
              <div className="col-6">
                <div className="bg-light-soft rounded-3 p-2 h-100">
                  <div className="smaller text-muted-soft fw-bold text-uppercase ls-1 mb-1">Disponible sur</div>
                  <div className="small fw-700 text-main truncate">{sw.os}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="bg-light-soft rounded-3 p-2 h-100">
                  <div className="smaller text-muted-soft fw-bold text-uppercase ls-1 mb-1">Prix</div>
                  <div className="small fw-700 text-main">{sw.price}</div>
                </div>
              </div>
              <div className="col-6 mt-2">
                <div className="p-1">
                  <div className="smaller text-muted-soft fw-bold text-uppercase ls-1 mb-1">Simplicité</div>
                  {renderStars(sw.simplicity)}
                </div>
              </div>
              <div className="col-6 mt-2">
                <div className="p-1">
                  <div className="smaller text-muted-soft fw-bold text-uppercase ls-1 mb-1">Fonctionnalités</div>
                  {renderStars(sw.features)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BroadcastingSoftwareList;
