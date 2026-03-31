import React from 'react';
import { 
  Book, Radio, Music, Zap, 
  HelpCircle, Info, 
  Calendar, Mic2, Share2, 
  ChevronRight,
  HardDrive, BarChart3
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const Documentation: React.FC = () => {
  return (
    <div className="container py-4">
      <div className="mb-5 text-center">
        <h1 className="fw-800 text-main mb-3 d-flex align-items-center justify-content-center gap-3">
          <div className="bg-primary text-white p-3 rounded-4 shadow-sm">
            <Book size={32} />
          </div>
          Centre d'Aide BantuWave
        </h1>
        <p className="text-muted-soft lead max-width-md mx-auto">
          Guide complet point par point pour maîtriser chaque module de votre plateforme de diffusion.
        </p>
      </div>

      {/* Introduction */}
      <div className="alert bg-primary-soft border-0 mb-5 p-4 rounded-4">
        <div className="d-flex gap-3">
          <Info className="text-primary mt-1" size={24} />
          <div>
            <h5 className="fw-bold text-primary mb-1">Architecture Technique</h5>
            <p className="small text-muted-soft mb-0">
              BantuWave utilise <strong>Icecast</strong> pour distribuer le son aux auditeurs et <strong>Liquidsoap</strong> comme moteur d'automatisation (AutoDJ).
              Toute modification de configuration majeure nécessite un <strong>Redémarrage</strong> de la station.
            </p>
          </div>
        </div>
      </div>

      {/* Modules Detail */}
      <div className="row g-4">
        
        {/* 1. Profil Station */}
        <div className="col-12">
          <section id="profil" className="mb-4">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-danger-soft text-danger p-2 rounded-3"><Radio size={20} /></div>
              1. Profil de la Station
            </h3>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="p-4">
                <p className="text-muted-soft small mb-4">C'est la carte d'identité de votre radio. Elle définit comment le public et les systèmes externes voient votre station.</p>
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold small text-uppercase ls-1">Champs Clés :</h6>
                    <ul className="list-unstyled smaller text-muted-soft d-flex flex-column gap-2 mt-3">
                      <li><ChevronRight size={14} className="text-danger me-1" /> <strong>Nom Court (Slug) :</strong> Identifiant unique dans l'URL. Ne peut pas être changé après création.</li>
                      <li><ChevronRight size={14} className="text-danger me-1" /> <strong>Genre & Description :</strong> Utilisés pour le référencement et l'affichage sur la page publique.</li>
                      <li><ChevronRight size={14} className="text-danger me-1" /> <strong>Zone Géographique :</strong> Permet d'afficher le drapeau de votre pays sur l'annuaire.</li>
                    </ul>
                  </div>
                  <div className="col-md-6 bg-light-soft p-3 rounded-3">
                    <h6 className="fw-bold small text-uppercase ls-1">Actions de Contrôle :</h6>
                    <div className="d-flex flex-column gap-2 mt-3">
                      <div className="d-flex align-items-center gap-2 smaller"><div className="bg-success p-1 rounded-circle" style={{width:6,height:6}}></div> <strong>Démarrer :</strong> Lance les processus Icecast/Liquidsoap.</div>
                      <div className="d-flex align-items-center gap-2 smaller"><div className="bg-danger p-1 rounded-circle" style={{width:6,height:6}}></div> <strong>Arrêter :</strong> Coupe instantanément tous les flux.</div>
                      <div className="d-flex align-items-center gap-2 smaller"><div className="bg-warning p-1 rounded-circle" style={{width:6,height:6}}></div> <strong>Redémarrer :</strong> Applique les nouvelles configurations.</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* 2. Médias */}
        <div className="col-md-6">
          <section id="medias" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-success-soft text-success p-2 rounded-3"><Music size={20} /></div>
              2. Gestion des Médias
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <p className="small text-muted-soft">Le cœur de votre bibliothèque musicale.</p>
                <ul className="list-unstyled smaller text-muted-soft d-flex flex-column gap-3">
                  <li className="d-flex gap-2">
                    <div className="fw-bold text-success">Transfert :</div>
                    <span>Envoyez vos fichiers MP3/AAC. Le système extrait automatiquement les pochettes et métadonnées.</span>
                  </li>
                  <li className="d-flex gap-2">
                    <div className="fw-bold text-success">Dossiers :</div>
                    <span>Créez des dossiers pour organiser vos jingles, publicités ou musiques par genre.</span>
                  </li>
                  <li className="d-flex gap-2">
                    <div className="fw-bold text-success">Édition :</div>
                    <span>Vous pouvez modifier les titres et artistes directement depuis l'interface pour un affichage propre sur le "Now Playing".</span>
                  </li>
                </ul>
              </div>
            </Card>
          </section>
        </div>

        {/* 3. Playlists */}
        <div className="col-md-6">
          <section id="playlists" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-info-soft text-info p-2 rounded-3"><Calendar size={20} /></div>
              3. Listes de Lecture
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <p className="small text-muted-soft">Déterminez <strong>quoi</strong> diffuser et <strong>quand</strong>.</p>
                <div className="bg-light-soft p-3 rounded-3 mb-3">
                  <h6 className="fw-bold smaller text-uppercase mb-2">Types de programmation :</h6>
                  <div className="smaller mb-1"><strong>• Rotation :</strong> Basée sur un poids (1-5). Plus le poids est élevé, plus les titres passent souvent.</div>
                  <div className="smaller mb-1"><strong>• Horaire :</strong> S'active uniquement sur une plage précise (ex: 08:00 - 10:00).</div>
                  <div className="smaller"><strong>• Intervalle :</strong> Diffuse après X chansons ou X minutes (Idéal pour les Jingles).</div>
                </div>
                <div className="smaller text-info d-flex align-items-center gap-2">
                  <Info size={14} /> Utilisez le bouton calendrier pour voir le planning visuel.
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* 4. Streamers/DJs */}
        <div className="col-12">
          <section id="streamers" className="mb-4">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-warning-soft text-warning p-2 rounded-3"><Mic2 size={20} /></div>
              4. Streamers & Direct (Live)
            </h3>
            <Card className="border-0 shadow-sm bg-dark text-white">
              <div className="p-4">
                <div className="row g-4">
                  <div className="col-md-7">
                    <h5 className="fw-bold text-warning mb-3">Connexion en Direct</h5>
                    <p className="small opacity-75">
                      Utilisez ces comptes pour vous connecter via un logiciel (Mixxx, BUTT, SAM Cast).
                    </p>
                    <div className="bg-white bg-opacity-10 p-3 rounded-3 border border-white border-opacity-10">
                      <h6 className="fw-bold smaller text-uppercase text-warning mb-2">Configuration Logicielle :</h6>
                      <ul className="list-unstyled smaller mb-0 d-flex flex-column gap-2">
                        <li><strong>Serveur :</strong> localhost (ou votre IP/Domaine)</li>
                        <li><strong>Port :</strong> <span className="badge bg-warning text-dark">8005</span> (Port Source Liquidsoap)</li>
                        <li><strong>Mount :</strong> /live (ou celui défini dans le profil)</li>
                        <li><strong>Auth :</strong> Utilisez l'identifiant et le mot de passe créés dans ce module.</li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-5 border-start border-white border-opacity-10 ps-md-4">
                    <h6 className="fw-bold smaller text-uppercase text-warning mb-3">Règles de Priorité :</h6>
                    <p className="smaller opacity-75">
                      Lorsqu'un DJ se connecte, l'<strong>AutoDJ s'efface automatiquement</strong> (fade-out) pour laisser la place au direct.
                      Une fois que le DJ se déconnecte, l'AutoDJ reprend instantanément.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* 5. Points de Montage & Relais */}
        <div className="col-md-6">
          <section id="mounts" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-primary-soft text-primary p-2 rounded-3"><Zap size={20} /></div>
              5. Points de Montage & Relais
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <h6 className="fw-bold small text-uppercase ls-1">Points de Montage :</h6>
                <p className="smaller text-muted-soft mb-3">Définissez vos formats de sortie (MP3 128k, AAC 64k, etc.). Chaque point de montage génère une URL d'écoute unique.</p>
                <h6 className="fw-bold small text-uppercase ls-1 mt-4">Relais Distants :</h6>
                <p className="smaller text-muted-soft">Permet de re-diffuser le flux de votre station vers un autre serveur Icecast ou Shoutcast externe.</p>
              </div>
            </Card>
          </section>
        </div>

        {/* 6. Webhooks & HLS */}
        <div className="col-md-6">
          <section id="external" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-secondary-soft text-secondary p-2 rounded-3"><Share2 size={20} /></div>
              6. Webhooks & Flux HLS
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <h6 className="fw-bold small text-uppercase ls-1">Webhooks :</h6>
                <p className="smaller text-muted-soft mb-3">Envoyez des notifications automatiques vers Discord, Telegram ou Twitter à chaque changement de titre.</p>
                <h6 className="fw-bold small text-uppercase ls-1 mt-4">Flux HLS :</h6>
                <p className="smaller text-muted-soft">Technologie moderne de streaming adaptatif. Idéal pour garantir une écoute sans coupure sur mobile même avec une connexion faible.</p>
              </div>
            </Card>
          </section>
        </div>

        {/* 7. SFTP & Podcasts */}
        <div className="col-md-6">
          <section id="storage" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-dark-soft text-dark p-2 rounded-3"><HardDrive size={20} /></div>
              7. SFTP & Podcasts
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <h6 className="fw-bold small text-uppercase ls-1">Utilisateurs SFTP :</h6>
                <p className="smaller text-muted-soft mb-3">Pour les transferts massifs de fichiers, créez un compte SFTP. Utilisez un logiciel comme <strong>FileZilla</strong> pour gérer vos fichiers à distance.</p>
                <h6 className="fw-bold small text-uppercase ls-1 mt-4">Podcasts :</h6>
                <p className="smaller text-muted-soft">Générez des flux RSS pour Spotify, Apple Podcasts ou Deezer à partir de vos émissions enregistrées.</p>
              </div>
            </Card>
          </section>
        </div>

        {/* 8. Audience & Configuration */}
        <div className="col-md-6">
          <section id="admin" className="h-100">
            <h3 className="fw-800 text-main mb-4 d-flex align-items-center gap-2">
              <div className="bg-info-soft text-info p-2 rounded-3"><BarChart3 size={20} /></div>
              8. Audience & Configuration
            </h3>
            <Card className="border-0 shadow-sm h-100">
              <div className="p-4">
                <h6 className="fw-bold small text-uppercase ls-1">Audience :</h6>
                <p className="smaller text-muted-soft mb-3">Suivez en temps réel le nombre d'auditeurs, leur origine géographique et les pics d'écoute par heure.</p>
                <h6 className="fw-bold small text-uppercase ls-1 mt-4">Configuration Avancée :</h6>
                <p className="smaller text-muted-soft">Réglages fins de Liquidsoap (crossfade, égaliseur) et options de sécurité pour limiter l'accès à certains pays.</p>
              </div>
            </Card>
          </section>
        </div>

      </div>

      {/* Support Section */}
      <div className="mt-5 bw-section bg-primary text-white border-0 p-5 rounded-4 text-center shadow-lg">
        <HelpCircle size={48} className="text-white opacity-50 mb-3" />
        <h4 className="fw-800 mb-3">Besoin d'aide supplémentaire ?</h4>
        <p className="opacity-75 max-width-md mx-auto mb-4 lead">
          Si un module ne fonctionne pas comme prévu, vérifiez les logs système ou contactez l'administrateur technique.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Button variant="light" className="px-4 fw-bold">Ouvrir un Ticket</Button>
          <Button variant="outline-primary" className="px-4 bg-white text-primary fw-bold">FAQ BantuWave</Button>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
