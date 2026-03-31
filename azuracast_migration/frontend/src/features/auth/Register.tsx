import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, UserPlus, Radio, Languages, Zap, Activity, Globe, Eye, EyeOff, ArrowLeft, Phone, Building2, MapPin, Briefcase } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CountrySelect from '../../components/ui/CountrySelect';
import api from '../../api/axios';

import { countries } from '../../utils/countries';

const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    account_type: 'individual',
    organization_name: '',
    structure_type: '',
    address: '',
    country: 'Cameroun',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    const countryData = countries.find(c => c.name === formData.country);
    if (countryData && !formData.phone) {
      setFormData(prev => ({ ...prev, phone: countryData.code + ' ' }));
    }
  }, [formData.country, formData.phone]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.error_mismatch'));
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/users/register/', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        account_type: formData.account_type,
        organization_name: formData.organization_name,
        structure_type: formData.structure_type,
        address: formData.address,
        country: formData.country,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : t('register.error_generic');
      setError(msg);
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
                {t('register.subtitle')}
              </p>
              
              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Zap size={20} />
                  </div>
                  <span className="small fw-bold text-white">Déploiement Instantané</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Activity size={20} />
                  </div>
                  <span className="small fw-bold text-white">Gestion Simplifiée</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-white bg-opacity-25 p-2 rounded-3">
                    <Globe size={20} />
                  </div>
                  <span className="small fw-bold text-white">Diffusion Mondiale</span>
                </div>
              </div>
            </div>
            
            <div className="auth-brand-footer pt-4 border-top border-white border-opacity-10 mt-auto">
              <p className="small mb-0 opacity-75">&copy; 2026 BantuWave Radio Cloud Platform.</p>
            </div>
          </div>

          <div className="col-lg-7 bg-surface p-4 p-md-5 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-5">
              <Link to="/login" className="btn btn-link p-0 text-muted-soft d-flex align-items-center gap-2 text-decoration-none transition-all hover-translate-x-left">
                <ArrowLeft size={18} />
                <span className="small fw-600">{t('register.login_link')}</span>
              </Link>
              <button onClick={toggleLanguage} className="btn btn-light-soft btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-2 transition-all">
                <Languages size={16} className="text-primary" />
                <span className="fw-bold small text-uppercase ls-1">{i18n.language}</span>
              </button>
            </div>

            <div className="my-auto mx-auto w-100" style={{ maxWidth: '500px' }}>
              <div className="mb-4 text-center text-lg-start">
                <h2 className="fw-800 text-main mb-1 display-6">{t('register.title')}</h2>
                <p className="text-muted-soft small">{t('register.subtitle')}</p>
              </div>

              {success ? (
                <div className="alert alert-success border-0 shadow-sm rounded-4 p-4 text-center">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-3">
                    <UserPlus size={32} />
                  </div>
                  <h4 className="fw-bold mb-2">Bienvenue à bord !</h4>
                  <p className="mb-0 text-muted-soft">{t('register.success')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  {error && (
                    <div className="alert alert-danger-soft border-0 rounded-3 small py-3 px-4 animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">Type de compte</label>
                      <div className="d-flex gap-3">
                        <button 
                          type="button"
                          className={`btn flex-grow-1 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border-2 transition-all ${formData.account_type === 'individual' ? 'btn-primary border-primary shadow-sm' : 'btn-light-soft border-transparent text-muted'}`}
                          onClick={() => setFormData({...formData, account_type: 'individual'})}
                        >
                          <User size={18} />
                          <span className="fw-bold small">Particulier</span>
                        </button>
                        <button 
                          type="button"
                          className={`btn flex-grow-1 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border-2 transition-all ${formData.account_type === 'organization' ? 'btn-primary border-primary shadow-sm' : 'btn-light-soft border-transparent text-muted'}`}
                          onClick={() => setFormData({...formData, account_type: 'organization'})}
                        >
                          <Building2 size={18} />
                          <span className="fw-bold small">Organisation</span>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <Input
                        label={t('register.name')}
                        name="name"
                        placeholder="Jean Jacques"
                        value={formData.name}
                        onChange={handleChange}
                        icon={<User size={16} className="text-muted-soft" />}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <CountrySelect
                        label="Pays"
                        value={formData.country}
                        onChange={(val) => setFormData({ ...formData, country: val })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <Input
                        label="Téléphone"
                        name="phone"
                        placeholder="+237 6XX XX XX XX"
                        value={formData.phone}
                        onChange={handleChange}
                        icon={<Phone size={16} className="text-muted-soft" />}
                        required
                      />
                    </div>

                    {formData.account_type === 'organization' && (
                      <>
                        <div className="col-md-6 animate-fade-in">
                          <Input
                            label="Nom de l'organisation"
                            name="organization_name"
                            placeholder="BantuWave"
                            value={formData.organization_name}
                            onChange={handleChange}
                            icon={<Building2 size={16} className="text-muted-soft" />}
                            required
                          />
                        </div>
                        <div className="col-md-6 animate-fade-in">
                          <Input
                            label="Type de structure"
                            name="structure_type"
                            placeholder="Entreprise privée"
                            value={formData.structure_type}
                            onChange={handleChange}
                            icon={<Briefcase size={16} className="text-muted-soft" />}
                            required
                          />
                        </div>
                        <div className="col-12 animate-fade-in">
                          <Input
                            label="Adresse"
                            name="address"
                            placeholder="Yaoundé, Cameroun"
                            value={formData.address}
                            onChange={handleChange}
                            icon={<MapPin size={16} className="text-muted-soft" />}
                            required
                          />
                        </div>
                      </>
                    )}

                    <div className="col-12">
                      <Input
                        label={t('register.email')}
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        icon={<Mail size={16} className="text-muted-soft" />}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <div className="position-relative">
                        <Input
                          label={t('register.password')}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          icon={<Lock size={16} className="text-muted-soft" />}
                          required
                        />
                        <button 
                          type="button" 
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y mt-2 text-muted-soft p-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <Input
                        label={t('register.confirm_password')}
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        icon={<Lock size={16} className="text-muted-soft" />}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-100 shadow-sm mt-3" 
                    loading={isLoading}
                    icon={<UserPlus size={20} />}
                  >
                    {t('register.submit')}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
