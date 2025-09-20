/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Sparkles,
  Users,
  MessageSquare,
  Shield,
  Award,
  MapPin
} from 'lucide-react';
import { memberAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './AdherentForm.css';

const AdherentForm = ({ isOpen, onClose, onSuccess, adherent = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    registration_date: new Date().toISOString().split('T')[0],
    is_active: true,
    penalty_amount: 0,
    notes: '',
    address: '',
    profession: '',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [validationStatus, setValidationStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (adherent) {
        // Mode édition
        setFormData({
          name: adherent.name || '',
          email: adherent.email || '',
          phone: adherent.phone || '',
          registration_date: adherent.registration_date || new Date().toISOString().split('T')[0],
          is_active: adherent.is_active !== undefined ? adherent.is_active : true,
          penalty_amount: adherent.penalty_amount || 0,
          notes: adherent.notes || '',
          address: adherent.address || '',
          profession: adherent.profession || '',
          birth_date: adherent.birth_date || '',
          emergency_contact: adherent.emergency_contact || '',
          emergency_phone: adherent.emergency_phone || ''
        });
      } else {
        // Mode création
        setFormData({
          name: '',
          email: '',
          phone: '',
          registration_date: new Date().toISOString().split('T')[0],
          is_active: true,
          penalty_amount: 0,
          notes: '',
          address: '',
          profession: '',
          birth_date: '',
          emergency_contact: '',
          emergency_phone: ''
        });
      }
      
      setErrors({});
      setStep(1);
      setShowPreview(false);
      setValidationStatus({});
    }
  }, [isOpen, adherent]);

  const validateField = (name, value) => {
    const validations = {
      name: (val) => {
        if (!val.trim()) return 'Le nom est requis';
        if (val.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(val)) return 'Le nom contient des caractères invalides';
        return null;
      },
      email: (val) => {
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Format d\'email invalide';
        return null;
      },
      phone: (val) => {
        if (val && !/^(\+237|237)?[2368]\d{8}$/.test(val.replace(/\s+/g, ''))) {
          return 'Format de téléphone invalide (ex: +237 6XX XXX XXX)';
        }
        return null;
      },
      emergency_phone: (val) => {
        if (val && !/^(\+237|237)?[2368]\d{8}$/.test(val.replace(/\s+/g, ''))) {
          return 'Format de téléphone invalide';
        }
        return null;
      },
      registration_date: (val) => {
        if (!val) return 'La date d\'inscription est requise';
        const date = new Date(val);
        const today = new Date();
        if (date > today) return 'La date d\'inscription ne peut pas être dans le futur';
        return null;
      },
      penalty_amount: (val) => {
        if (val < 0) return 'Le montant des pénalités ne peut pas être négatif';
        return null;
      },
      birth_date: (val) => {
        if (val) {
          const date = new Date(val);
          const today = new Date();
          const age = today.getFullYear() - date.getFullYear();
          if (date > today) return 'La date de naissance ne peut pas être dans le futur';
          if (age > 100) return 'Veuillez vérifier la date de naissance';
        }
        return null;
      }
    };

    return validations[name] ? validations[name](value) : null;
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    const newValidationStatus = {};

    if (currentStep === 1) {
      // Validation étape 1 : Informations personnelles
      const fields = ['name', 'email', 'phone', 'registration_date'];
      fields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          newValidationStatus[field] = 'error';
        } else if (formData[field]) {
          newValidationStatus[field] = 'success';
        }
      });
    }

    if (currentStep === 2) {
      // Validation étape 2 : Informations complémentaires
      const fields = ['penalty_amount', 'birth_date', 'emergency_phone'];
      fields.forEach(field => {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          newValidationStatus[field] = 'error';
        } else if (formData[field]) {
          newValidationStatus[field] = 'success';
        }
      });
    }

    setErrors(newErrors);
    setValidationStatus(newValidationStatus);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Validation en temps réel
    const error = validateField(name, newValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setValidationStatus(prev => ({
      ...prev,
      [name]: error ? 'error' : (newValue ? 'success' : null)
    }));
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handlePreview = () => {
    if (validateStep(1) && validateStep(2)) {
      setShowPreview(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        penalty_amount: parseFloat(formData.penalty_amount) || 0,
        notes: formData.notes?.trim() || null,
        address: formData.address?.trim() || null,
        profession: formData.profession?.trim() || null,
        emergency_contact: formData.emergency_contact?.trim() || null,
        emergency_phone: formData.emergency_phone?.trim() || null,
        birth_date: formData.birth_date || null
      };

      if (adherent) {
        await memberAPI.updateAdherent(adherent.id, submitData);
        toast.success('Adhérent modifié avec succès');
      } else {
        await memberAPI.createAdherent(submitData);
        toast.success('Adhérent créé avec succès');
      }
      
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Erreur sauvegarde adhérent:', err);
      const errorMessage = err?.message || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      registration_date: new Date().toISOString().split('T')[0],
      is_active: true,
      penalty_amount: 0,
      notes: '',
      address: '',
      profession: '',
      birth_date: '',
      emergency_contact: '',
      emergency_phone: ''
    });
    setErrors({});
    setStep(1);
    setShowPreview(false);
    setValidationStatus({});
    onClose();
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR').format(numAmount) + ' FCFA';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay adherent-modern" onClick={handleClose}>
      <div className="modal-content adherent-modern" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header adherent-modern">
          <div className="modal-title">
            <div className="title-icon adherent">
              <Users size={24} />
              <div className="icon-badge">
                <Award size={12} />
              </div>
            </div>
            <div className="title-content">
              <h2>{adherent ? 'Modifier l\'Adhérent' : 'Nouvel Adhérent'}</h2>
              <p>{showPreview ? 'Aperçu du profil' : `Étape ${step} sur 2`}</p>
            </div>
          </div>
          <button className="modal-close adherent-modern" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        {!showPreview && (
          <div className="progress-container adherent">
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-number">
                  {step > 1 ? <CheckCircle size={16} /> : '1'}
                </div>
                <span>Informations Personnelles</span>
              </div>
              <div className="progress-line">
                <div className={`progress-fill ${step > 1 ? 'completed' : ''}`}></div>
              </div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>Informations Complémentaires</span>
              </div>
            </div>
          </div>
        )}

        {showPreview ? (
          /* Preview Mode */
          <div className="preview-container adherent">
            <div className="member-preview-card">
              <div className="preview-header">
                <div className="member-avatar">
                  <User size={32} />
                </div>
                <div className="member-info">
                  <h3>{formData.name}</h3>
                  <div className="member-status">
                    {formData.is_active ? (
                      <div className="status-badge active">
                        <UserCheck size={14} />
                        <span>Actif</span>
                      </div>
                    ) : (
                      <div className="status-badge inactive">
                        <UserX size={14} />
                        <span>Inactif</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="preview-sections">
                <div className="preview-section">
                  <h4><User size={16} /> Informations Personnelles</h4>
                  <div className="preview-grid">
                    {formData.email && (
                      <div className="preview-item">
                        <Mail size={14} />
                        <span>Email</span>
                        <strong>{formData.email}</strong>
                      </div>
                    )}
                    {formData.phone && (
                      <div className="preview-item">
                        <Phone size={14} />
                        <span>Téléphone</span>
                        <strong>{formData.phone}</strong>
                      </div>
                    )}
                    {formData.birth_date && (
                      <div className="preview-item">
                        <Calendar size={14} />
                        <span>Date de naissance</span>
                        <strong>{formatDate(formData.birth_date)} ({getAge(formData.birth_date)} ans)</strong>
                      </div>
                    )}
                    <div className="preview-item">
                      <Calendar size={14} />
                      <span>Date d'inscription</span>
                      <strong>{formatDate(formData.registration_date)}</strong>
                    </div>
                  </div>
                </div>

                {(formData.profession || formData.address) && (
                  <div className="preview-section">
                    <h4><Shield size={16} /> Informations Professionnelles</h4>
                    <div className="preview-grid">
                      {formData.profession && (
                        <div className="preview-item">
                          <Award size={14} />
                          <span>Profession</span>
                          <strong>{formData.profession}</strong>
                        </div>
                      )}
                      {formData.address && (
                        <div className="preview-item">
                          <MapPin size={14} />
                          <span>Adresse</span>
                          <strong>{formData.address}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.emergency_contact || formData.emergency_phone) && (
                  <div className="preview-section">
                    <h4><AlertCircle size={16} /> Contact d'Urgence</h4>
                    <div className="preview-grid">
                      {formData.emergency_contact && (
                        <div className="preview-item">
                          <User size={14} />
                          <span>Nom</span>
                          <strong>{formData.emergency_contact}</strong>
                        </div>
                      )}
                      {formData.emergency_phone && (
                        <div className="preview-item">
                          <Phone size={14} />
                          <span>Téléphone</span>
                          <strong>{formData.emergency_phone}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(formData.penalty_amount > 0 || formData.notes) && (
                  <div className="preview-section">
                    <h4><FileText size={16} /> Informations Additionnelles</h4>
                    <div className="preview-grid">
                      {formData.penalty_amount > 0 && (
                        <div className="preview-item penalty">
                          <DollarSign size={14} />
                          <span>Pénalités</span>
                          <strong>{formatAmount(formData.penalty_amount)}</strong>
                        </div>
                      )}
                      {formData.notes && (
                        <div className="preview-item full-width">
                          <MessageSquare size={14} />
                          <span>Notes</span>
                          <strong>{formData.notes}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="preview-actions">
              <button 
                type="button" 
                onClick={() => setShowPreview(false)} 
                className="btn-secondary"
              >
                Modifier
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="btn-primary adherent"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Save size={18} />
                    {adherent ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Form Steps */
          <form onSubmit={handleSubmit} className="adherent-form modern">
            {step === 1 && (
              <div className="form-step active">
                <div className="step-header">
                  <User size={20} />
                  <h3>Informations Personnelles</h3>
                  <p>Renseignez les informations de base de l'adhérent</p>
                </div>

                <div className="form-grid">
                  {/* Nom complet */}
                  <div className="form-group full-width">
                    <label htmlFor="name">Nom complet *</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.name === 'error' ? 'error' : ''} ${validationStatus.name === 'success' ? 'success' : ''}`}
                        placeholder="Entrez le nom complet"
                      />
                      <User size={16} className="input-icon" />
                      {validationStatus.name === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.name === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-container">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.email === 'error' ? 'error' : ''} ${validationStatus.email === 'success' ? 'success' : ''}`}
                        placeholder="exemple@email.com"
                      />
                      <Mail size={16} className="input-icon" />
                      {validationStatus.email === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.email === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  {/* Téléphone */}
                  <div className="form-group">
                    <label htmlFor="phone">Téléphone</label>
                    <div className="input-container">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.phone === 'error' ? 'error' : ''} ${validationStatus.phone === 'success' ? 'success' : ''}`}
                        placeholder="+237 6XX XXX XXX"
                      />
                      <Phone size={16} className="input-icon" />
                      {validationStatus.phone === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.phone === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.phone && <span className="error-message">{errors.phone}</span>}
                  </div>

                  {/* Date d'inscription */}
                  <div className="form-group">
                    <label htmlFor="registration_date">Date d'inscription *</label>
                    <div className="input-container">
                      <input
                        type="date"
                        id="registration_date"
                        name="registration_date"
                        value={formData.registration_date}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.registration_date === 'error' ? 'error' : ''} ${validationStatus.registration_date === 'success' ? 'success' : ''}`}
                      />
                      <Calendar size={16} className="input-icon" />
                      {validationStatus.registration_date === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.registration_date === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.registration_date && <span className="error-message">{errors.registration_date}</span>}
                  </div>

                  {/* Date de naissance */}
                  <div className="form-group">
                    <label htmlFor="birth_date">Date de naissance</label>
                    <div className="input-container">
                      <input
                        type="date"
                        id="birth_date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.birth_date === 'error' ? 'error' : ''} ${validationStatus.birth_date === 'success' ? 'success' : ''}`}
                      />
                      <Calendar size={16} className="input-icon" />
                      {validationStatus.birth_date === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.birth_date === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.birth_date && <span className="error-message">{errors.birth_date}</span>}
                    {formData.birth_date && !errors.birth_date && (
                      <div className="field-hint">Âge: {getAge(formData.birth_date)} ans</div>
                    )}
                  </div>

                  {/* Statut actif */}
                  <div className="form-group status-group">
                    <label className="status-toggle">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      <span className="toggle-slider"></span>
                      <div className="toggle-content">
                        <span className="toggle-label">Adhérent actif</span>
                        <span className="toggle-description">
                          {formData.is_active ? 'Membre actif du club' : 'Membre inactif'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step active">
                <div className="step-header">
                  <Shield size={20} />
                  <h3>Informations Complémentaires</h3>
                  <p>Ajoutez des détails supplémentaires (optionnels)</p>
                </div>

                <div className="form-grid">
                  {/* Profession */}
                  <div className="form-group">
                    <label htmlFor="profession">Profession</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="profession"
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Métier/Profession"
                      />
                      <Award size={16} className="input-icon" />
                    </div>
                  </div>

                  {/* Montant des pénalités */}
                  <div className="form-group">
                    <label htmlFor="penalty_amount">Pénalités (FCFA)</label>
                    <div className="input-container">
                      <input
                        type="number"
                        id="penalty_amount"
                        name="penalty_amount"
                        value={formData.penalty_amount}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.penalty_amount === 'error' ? 'error' : ''}`}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <DollarSign size={16} className="input-icon" />
                      {validationStatus.penalty_amount === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.penalty_amount && <span className="error-message">{errors.penalty_amount}</span>}
                    {formData.penalty_amount > 0 && (
                      <div className="field-hint penalty">
                        Montant: {formatAmount(formData.penalty_amount)}
                      </div>
                    )}
                  </div>

                  {/* Adresse */}
                  <div className="form-group full-width">
                    <label htmlFor="address">Adresse</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Adresse complète"
                      />
                      <MapPin size={16} className="input-icon" />
                    </div>
                  </div>

                  {/* Contact d'urgence */}
                  <div className="form-group">
                    <label htmlFor="emergency_contact">Contact d'urgence</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="emergency_contact"
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Nom du contact d'urgence"
                      />
                      <User size={16} className="input-icon" />
                    </div>
                  </div>

                  {/* Téléphone d'urgence */}
                  <div className="form-group">
                    <label htmlFor="emergency_phone">Téléphone d'urgence</label>
                    <div className="input-container">
                      <input
                        type="tel"
                        id="emergency_phone"
                        name="emergency_phone"
                        value={formData.emergency_phone}
                        onChange={handleInputChange}
                        className={`form-input ${validationStatus.emergency_phone === 'error' ? 'error' : ''} ${validationStatus.emergency_phone === 'success' ? 'success' : ''}`}
                        placeholder="+237 6XX XXX XXX"
                      />
                      <Phone size={16} className="input-icon" />
                      {validationStatus.emergency_phone === 'success' && (
                        <CheckCircle size={16} className="validation-icon success" />
                      )}
                      {validationStatus.emergency_phone === 'error' && (
                        <AlertCircle size={16} className="validation-icon error" />
                      )}
                    </div>
                    {errors.emergency_phone && <span className="error-message">{errors.emergency_phone}</span>}
                  </div>

                  {/* Notes */}
                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <div className="textarea-container">
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="form-textarea"
                        rows="3"
                        placeholder="Notes additionnelles sur l'adhérent..."
                      />
                      <MessageSquare size={16} className="textarea-icon" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="modal-footer adherent-modern">
              {step === 1 ? (
                <>
                  <button type="button" onClick={handleClose} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="button" onClick={handleNextStep} className="btn-primary adherent">
                    Suivant
                    <Sparkles size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handlePrevStep} className="btn-secondary">
                    Précédent
                  </button>
                  <button type="button" onClick={handlePreview} className="btn-secondary">
                    <CheckCircle size={16} />
                    Aperçu
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary adherent">
                    {loading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <Save size={16} />
                        {adherent ? 'Modifier' : 'Créer'}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdherentForm;