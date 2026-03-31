import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, Radio, Languages, Zap, Activity, Globe, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import api from '../../api/axios';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsForgotModalOpen(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    
    setIsForgotLoading(true);
    try {
      await api.post('/users/request_password_reset/', { email: forgotEmail });
      alert("Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.");
      setIsForgotModalOpen(false);
      setForgotEmail('');
    } catch {
      alert("Une erreur est survenue. Veuillez réessayer plus tard.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError(t('login.error_invalid'));
      }
    } catch {
      setError(t('login.error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center p-3 p-md-4">
      <div className="auth-shell overflow-hidden">
        <div className="row g-0">
          <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 auth-brand-panel position-relative">
            <div className="position-relative" style={{ zIndex: 1 }}>
              <div className="bg-white bg-opacity-15 rounded-3 d-inline-flex p-3 mb-4">
                <Radio className="text-white" size={44} />
              </div>
              <h1 className="fw-bold tracking-tight mb-2 display-5">BantuWave</h1>
              <p className="lead mb-4 opacity-90" style={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
                Régie radio, automatisation et diffusion — interface claire et fiable.
              </p>
              
              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Zap size={20} />
                  </div>
                  <span className="small fw-bold text-white">AutoDJ Intelligent</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Activity size={20} />
                  </div>
                  <span className="small fw-bold text-white">Analytics en temps réel</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Globe size={20} />
                  </div>
                  <span className="small fw-bold text-white">Diffusion mondiale (HLS/Icecast)</span>
                </div>
              </div>
            </div>

            <div className="position-relative" style={{ zIndex: 1 }}>
              <p className="small opacity-80 mb-0">&copy; {new Date().getFullYear()} BantuWave</p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="col-lg-7 p-4 p-md-5 bg-surface">
            <div className="d-flex justify-content-between align-items-start mb-4 mb-md-5 gap-3">
              <div>
                <h2 className="fw-bold text-main mb-1 h3">{t('login.title')}</h2>
                <p className="text-muted-soft small mb-0">Connexion sécurisée à votre console</p>
              </div>
              <button
                type="button"
                className="btn btn-light-soft rounded-pill px-3 py-2 border border-light-subtle shadow-none d-flex align-items-center gap-2"
                onClick={toggleLanguage}
              >
                <Languages size={18} className="text-muted-soft" />
                <span className="small fw-semibold text-uppercase text-muted-soft">{i18n.language}</span>
              </button>
            </div>
            
            {error && (
              <div className="alert bg-danger bg-opacity-10 text-danger border-0 small py-3 px-4 mb-4 rounded-4 d-flex align-items-center gap-3">
                <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                  <span className="fw-bold small">!</span>
                </div>
                <span className="fw-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <Input
                  label={t('login.email')}
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail size={18} className="text-muted-soft" />}
                  className="rounded-4 py-3 border-light-soft bg-light-soft fw-bold shadow-none"
                  required
                />
              </div>
              
              <div className="mb-4">
                <Input
                  label={t('login.password')}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={18} className="text-muted-soft" />}
                  rightElement={
                    <button 
                      type="button" 
                      className="btn btn-link p-0 text-muted-soft shadow-none border-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  className="rounded-4 py-3 border-light-soft bg-light-soft fw-bold shadow-none"
                  required
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="form-check custom-checkbox">
                  <input type="checkbox" className="form-check-input shadow-none" id="remember" />
                  <label className="form-check-label small text-muted-soft fw-800" htmlFor="remember">
                    {t('login.remember_me')}
                  </label>
                </div>
                <a href="#" className="small text-danger text-decoration-none fw-900" onClick={handleForgotPassword}>
                  {t('login.forgot_password')}
                </a>
              </div>

              <Button
                variant="danger"
                type="submit"
                className="w-100 py-3 rounded-3 fw-semibold"
                loading={isLoading}
                icon={<LogIn size={20} />}
              >
                {t('login.submit')}
              </Button>

              <div className="text-center mt-4">
                <Link to="/register" className="btn btn-link text-muted-soft small text-decoration-none d-inline-flex align-items-center gap-2 transition-all hover-translate-y">
                  <UserPlus size={16} className="text-primary" />
                  <span className="fw-600">{t('login.register_link')}</span>
                </Link>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-muted small mb-0">BantuWave</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Récupération de mot de passe"
      >
        <form onSubmit={handleForgotSubmit}>
          <p className="small text-muted mb-4">
            Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>
          <Input
            label="Adresse e-mail"
            type="email"
            placeholder="votre@email.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            icon={<Mail size={18} className="text-muted" />}
          />
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" type="button" onClick={() => setIsForgotModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" type="submit" loading={isForgotLoading}>
              Envoyer le lien
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Login;
