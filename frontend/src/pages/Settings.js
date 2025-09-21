/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell,
  Save,
  Mail,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
  const { user, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Validation de la force du mot de passe
  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Au moins 8 caractères');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Une majuscule');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Une minuscule');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Un chiffre');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Un caractère spécial');
    }

    return { score, feedback };
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Le mot de passe n\'est pas assez fort');
      return;
    }
    
    try {
      setLoading(true);
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        setPasswordData({ 
          currentPassword: '', 
          newPassword: '', 
          confirmPassword: '' 
        });
        setPasswordStrength({ score: 0, feedback: [] });
        toast.success('Mot de passe modifié avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return '#ef4444';
      case 2:
        return '#f59e0b';
      case 3:
        return '#3b82f6';
      case 4:
      case 5:
        return '#10b981';
      default:
        return '#e5e7eb';
    }
  };

  const getPasswordStrengthText = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'Très faible';
      case 2:
        return 'Faible';
      case 3:
        return 'Moyen';
      case 4:
        return 'Fort';
      case 5:
        return 'Très fort';
      default:
        return '';
    }
  };

  const getRoleDetails = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          label: 'Administrateur',
          icon: Shield,
          description: 'Accès complet au système'
        };
      case 'tresorier':
        return {
          label: 'Trésorier',
          icon: User,
          description: 'Gestion des finances'
        };
      case 'commissaire':
        return {
          label: 'Commissaire',
          icon: CheckCircle,
          description: 'Validation des opérations'
        };
              default:
        return {
          label: 'Utilisateur',
          icon: User,
          description: 'Accès standard'
        };
    }
  };

  const roleDetails = getRoleDetails(user?.role);
  const RoleIcon = roleDetails.icon;

  return (
    <div className="settings-page modern">
      {/* Header moderne */}
      <div className="page-header modern">
        <h1>
          <div className="header-icon">
            <SettingsIcon size={24} />
          </div>
          Paramètres
        </h1>
        <p>Gérez vos préférences et la sécurité de votre compte</p>
      </div>

      <div className="settings-container modern">
        {/* Sidebar moderne */}
        <div className="settings-sidebar modern">
          <button 
            className={`settings-tab modern ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="tab-icon">
              <User size={18} />
            </div>
            <span>Profil</span>
          </button>
          
          <button 
            className={`settings-tab modern ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <div className="tab-icon">
              <Lock size={18} />
            </div>
            <span>Sécurité</span>
          </button>
          
          <button 
            className={`settings-tab modern ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="tab-icon">
              <Bell size={18} />
            </div>
            <span>Notifications</span>
          </button>
        </div>

        {/* Content moderne */}
        <div className="settings-content modern">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>
                <div className="section-icon">
                  <User size={20} />
                </div>
                Informations du Profil
              </h2>
              
              <div className="profile-info modern">
                <div className="info-item modern">
                  <label>
                    <User size={16} />
                    Nom complet
                  </label>
                  <span>{user?.name || 'Non renseigné'}</span>
                </div>
                
                <div className="info-item modern">
                  <label>
                    <Mail size={16} />
                    Adresse email
                  </label>
                  <span>{user?.email || 'Non renseigné'}</span>
                </div>
                
                <div className="info-item modern">
                  <label>
                    <Shield size={16} />
                    Rôle et permissions
                  </label>
                  <span className="role-badge modern">
                    <div className="role-icon">
                      <RoleIcon size={14} />
                    </div>
                    {roleDetails.label}
                  </span>
                </div>

                {user?.created_at && (
                  <div className="info-item modern">
                    <label>
                      <Clock size={16} />
                      Membre depuis
                    </label>
                    <span>{new Date(user.created_at).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>
                <div className="section-icon">
                  <Lock size={20} />
                </div>
                Sécurité du Compte
              </h2>
              
              <form onSubmit={handlePasswordSubmit} className="password-form modern">
                <div className="form-group modern">
                  <label>Mot de passe actuel</label>
                  <div className="input-container">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Saisissez votre mot de passe actuel"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group modern">
                  <label>Nouveau mot de passe</label>
                  <div className="input-container">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Choisissez un nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {/* Indicateur de force du mot de passe */}
                  {passwordData.newPassword && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          background: '#e5e7eb',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            height: '100%',
                            background: getPasswordStrengthColor(passwordStrength.score),
                            transition: 'all 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: getPasswordStrengthColor(passwordStrength.score)
                        }}>
                          {getPasswordStrengthText(passwordStrength.score)}
                        </span>
                      </div>
                      
                      {passwordStrength.feedback.length > 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          padding: '0.5rem',
                          background: 'rgba(248, 250, 252, 0.5)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(226, 232, 240, 0.3)'
                        }}>
                          <strong>Améliorer avec :</strong> {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group modern">
                  <label>Confirmer le nouveau mot de passe</label>
                  <div className="input-container">
                    <CheckCircle size={16} className="input-icon" />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirmez votre nouveau mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {/* Validation de la confirmation */}
                  {passwordData.confirmPassword && (
                    <div style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <>
                          <CheckCircle size={14} style={{ color: '#10b981' }} />
                          <span style={{ color: '#10b981' }}>Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} style={{ color: '#ef4444' }} />
                          <span style={{ color: '#ef4444' }}>Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary modern"
                  disabled={
                    loading || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordStrength.score < 3
                  }
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <Save size={18} />
                      Mettre à jour le mot de passe
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>
                <div className="section-icon">
                  <Bell size={20} />
                </div>
                Préférences de Notification
              </h2>
              
              <div className="notifications-section">
                <div className="coming-soon">
                  <Sparkles size={48} />
                  <h3>Fonctionnalité à venir</h3>
                  <p>
                    Les paramètres de notification seront bientôt disponibles. 
                    Vous pourrez personnaliser vos alertes et rappels selon vos préférences.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;