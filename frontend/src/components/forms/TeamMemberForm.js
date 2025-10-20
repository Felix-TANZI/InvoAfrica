/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - Moderne

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Users, 
  Mail,
  Phone,
  Calendar,
  DollarSign,
  User,
  Crown,
  Shield,
  Award,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { memberAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './TeamMemberForm.css';

const TeamMemberForm = ({ isOpen, onClose, onSuccess, teamMember = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    registration_date: new Date().toISOString().split('T')[0],
    is_active: true,
    penalty_amount: 0,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationStatus, setValidationStatus] = useState({});

  // Postes prédéfinis du bureau avec icônes
  const positions = [
    { value: 'Président', label: 'Président', icon: Crown, color: 'warning' },
    { value: 'Vice-Président', label: 'Vice-Président', icon: Shield, color: 'info' },
    { value: 'Conseiller spécial', label: 'Conseiller spécial', icon: Award, color: 'success' },
    { value: 'Secrétaire Général', label: 'Secrétaire Général', icon: Users, color: 'primary' },
    { value: 'Secrétaire Général Adjoint', label: 'Secrétaire Général Adjoint', icon: Users, color: 'primary' },
    { value: 'Chef Cellule Financière', label: 'Chef Cellule Financière', icon: DollarSign, color: 'success' },
    { value: 'Commissaire aux comptes', label: 'Commissaire aux Comptes', icon: DollarSign, color: 'success' },
    { value: 'Censeur', label: 'Censeur', icon: Shield, color: 'info' },
    { value: 'Chef cellule communication', label: 'Chef cellule communication', icon: Users, color: 'primary' },
    { value: 'Adjoint cellule communication', label: 'Adjoint cellule communication', icon: User, color: 'neutral' },
    { value: 'Ambassadrice', label: 'Ambassadrice', icon: Award, color: 'accent' },
    { value: 'Chef cellule projet', label: 'Chef cellule projet', icon: Users, color: 'primary' },
    { value: 'Adjoint cellule projet', label: 'Adjoint cellule projet', icon: User, color: 'neutral' },
    { value: 'Secrétaire particulier', label: 'Secrétaire particulier', icon: User, color: 'neutral' },
    { value: 'Chef cellule formation', label: 'Chef cellule formation', icon: Users, color: 'primary' },
    { value: 'Adjoint cellule formation', label: 'Adjoint cellule formation', icon: User, color: 'neutral' },
    { value: 'Assistant Backend', label: 'Assistant Backend', icon: User, color: 'neutral' },
    { value: 'Chef cellule compétition', label: 'Chef cellule compétition', icon: Award, color: 'accent' },
    { value: 'Adjoint cellule competition', label: 'Adjoint cellule competition', icon: User, color: 'neutral' },
    { value: 'Chargé des Relations externes', label: 'Chargé des Relations externes', icon: Users, color: 'primary' },
    { value: 'Chargé des relations internes', label: 'Chargé des Relations internes', icon: Users, color: 'primary' },
    { value: 'Adjoint cellule Relation Exterieure', label: 'Adjoint Cellule Relation Exterieure', icon: User, color: 'neutral' },
    { value: 'Directeur de Publication du Hello World', label: 'Directeur de Publication', icon: Award, color: 'accent' },
    { value: 'Chef Cellule Logistique', label: 'Chef Cellule Logistique', icon: DollarSign, color: 'success' },
    { value: 'Adjoint Cellule Logistique', label: 'Adjoint Cellule Logistique', icon: User, color: 'neutral' },
    { value: 'Membre', label: 'Membre', icon: User, color: 'neutral' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (teamMember) {
        // Mode édition - pré-remplir le formulaire
        setFormData({
          name: teamMember.name || '',
          email: teamMember.email || '',
          phone: teamMember.phone || '',
          position: teamMember.position || '',
          registration_date: teamMember.registration_date || new Date().toISOString().split('T')[0],
          is_active: teamMember.is_active !== undefined ? teamMember.is_active : true,
          penalty_amount: teamMember.penalty_amount || 0,
          notes: teamMember.notes || ''
        });
      } else {
        // Mode création - formulaire vide
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          registration_date: new Date().toISOString().split('T')[0],
          is_active: true,
          penalty_amount: 0,
          notes: ''
        });
      }
      setErrors({});
      setValidationStatus({});
    }
  }, [isOpen, teamMember]);

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
      position: (val) => {
        if (!val.trim()) return 'Le poste est requis';
        return null;
      },
      registration_date: (val) => {
        if (!val) return 'La date d\'inscription est requise';
        const date = new Date(val);
        const today = new Date();
        if (date > today) return 'La date ne peut pas être dans le futur';
        return null;
      },
      penalty_amount: (val) => {
        if (val < 0) return 'Le montant ne peut pas être négatif';
        return null;
      }
    };

    return validations[name] ? validations[name](value) : null;
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

  const validateForm = () => {
    const newErrors = {};
    const newValidationStatus = {};

    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        newValidationStatus[field] = 'error';
      } else if (formData[field]) {
        newValidationStatus[field] = 'success';
      }
    });

    setErrors(newErrors);
    setValidationStatus(newValidationStatus);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setLoading(true);
      
      // Préparer les données à envoyer
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        position: formData.position.trim(),
        penalty_amount: parseFloat(formData.penalty_amount) || 0,
        notes: formData.notes?.trim() || null
      };

      if (teamMember) {
        // Mode édition
        await memberAPI.updateTeamMember(teamMember.id, submitData);
        toast.success('Membre du bureau modifié avec succès');
      } else {
        // Mode création
        await memberAPI.createTeamMember(submitData);
        toast.success('Membre du bureau créé avec succès');
      }
      
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Erreur sauvegarde team member:', err);
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
      position: '',
      registration_date: new Date().toISOString().split('T')[0],
      is_active: true,
      penalty_amount: 0,
      notes: ''
    });
    setErrors({});
    setValidationStatus({});
    onClose();
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR').format(numAmount) + ' FCFA';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay team-modern" onClick={handleClose}>
      <div className="modal-content team-modern" onClick={(e) => e.stopPropagation()}>
        {/* Header moderne */}
        <div className="modal-header team-modern">
          <div className="modal-title">
            <div className="title-icon team">
              <Users size={24} />
              <div className="icon-badge team">
                <Crown size={12} />
              </div>
            </div>
            <div className="title-content">
              <h2>{teamMember ? 'Modifier le Membre' : 'Nouveau Membre du Bureau'}</h2>
              <p>Gestion des membres du bureau exécutif</p>
            </div>
          </div>
          <button className="modal-close team-modern" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="team-member-form modern">
          <div className="form-grid modern">
            {/* Nom */}
            <div className="form-group modern">
              <label htmlFor="name">Nom complet *</label>
              <div className="input-container modern">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input modern ${validationStatus.name === 'error' ? 'error' : ''} ${validationStatus.name === 'success' ? 'success' : ''}`}
                  placeholder="Entrez le nom complet"
                  required
                />
                <User size={16} className="input-icon modern" />
                {validationStatus.name === 'success' && (
                  <CheckCircle size={16} className="validation-icon modern success" />
                )}
                {validationStatus.name === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.name && <span className="error-message modern">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group modern">
              <label htmlFor="email">Email</label>
              <div className="input-container modern">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input modern ${validationStatus.email === 'error' ? 'error' : ''} ${validationStatus.email === 'success' ? 'success' : ''}`}
                  placeholder="exemple@email.com"
                />
                <Mail size={16} className="input-icon modern" />
                {validationStatus.email === 'success' && (
                  <CheckCircle size={16} className="validation-icon modern success" />
                )}
                {validationStatus.email === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.email && <span className="error-message modern">{errors.email}</span>}
            </div>

            {/* Téléphone */}
            <div className="form-group modern">
              <label htmlFor="phone">Téléphone</label>
              <div className="input-container modern">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input modern ${validationStatus.phone === 'error' ? 'error' : ''} ${validationStatus.phone === 'success' ? 'success' : ''}`}
                  placeholder="+237 6XX XXX XXX"
                />
                <Phone size={16} className="input-icon modern" />
                {validationStatus.phone === 'success' && (
                  <CheckCircle size={16} className="validation-icon modern success" />
                )}
                {validationStatus.phone === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.phone && <span className="error-message modern">{errors.phone}</span>}
            </div>

            {/* Poste */}
            <div className="form-group modern">
              <label htmlFor="position">Poste dans le bureau *</label>
              <div className="input-container modern">
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`form-select modern ${validationStatus.position === 'error' ? 'error' : ''} ${validationStatus.position === 'success' ? 'success' : ''}`}
                  required
                >
                  <option value="">Sélectionnez un poste</option>
                  {positions.map(position => {
                    const IconComponent = position.icon;
                    return (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    );
                  })}
                </select>
                <Crown size={16} className="input-icon modern" />
                {validationStatus.position === 'success' && (
                  <CheckCircle size={16} className="validation-icon modern success" />
                )}
                {validationStatus.position === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.position && <span className="error-message modern">{errors.position}</span>}
            </div>

            {/* Date d'inscription */}
            <div className="form-group modern">
              <label htmlFor="registration_date">Date d'entrée au bureau *</label>
              <div className="input-container modern">
                <input
                  type="date"
                  id="registration_date"
                  name="registration_date"
                  value={formData.registration_date}
                  onChange={handleInputChange}
                  className={`form-input modern ${validationStatus.registration_date === 'error' ? 'error' : ''} ${validationStatus.registration_date === 'success' ? 'success' : ''}`}
                  required
                />
                <Calendar size={16} className="input-icon modern" />
                {validationStatus.registration_date === 'success' && (
                  <CheckCircle size={16} className="validation-icon modern success" />
                )}
                {validationStatus.registration_date === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.registration_date && <span className="error-message modern">{errors.registration_date}</span>}
            </div>

            {/* Montant des pénalités */}
            <div className="form-group modern">
              <label htmlFor="penalty_amount">Pénalités (FCFA)</label>
              <div className="input-container modern">
                <input
                  type="number"
                  id="penalty_amount"
                  name="penalty_amount"
                  value={formData.penalty_amount}
                  onChange={handleInputChange}
                  className={`form-input modern ${validationStatus.penalty_amount === 'error' ? 'error' : ''}`}
                  min="0"
                  step="1"
                  placeholder="0"
                />
                <DollarSign size={16} className="input-icon modern" />
                {validationStatus.penalty_amount === 'error' && (
                  <AlertCircle size={16} className="validation-icon modern error" />
                )}
              </div>
              {errors.penalty_amount && <span className="error-message modern">{errors.penalty_amount}</span>}
              {formData.penalty_amount > 0 && !errors.penalty_amount && (
                <div className="field-hint penalty">
                  Montant: {formatAmount(formData.penalty_amount)}
                </div>
              )}
            </div>

            {/* Statut actif */}
            <div className="form-group checkbox-group modern">
              <label className="checkbox-label modern">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom modern"></span>
                <div className="toggle-content modern">
                  <span className="toggle-label modern">Membre actif du bureau</span>
                  <span className="toggle-description modern">
                    {formData.is_active ? 'Membre actif et opérationnel' : 'Membre inactif temporairement'}
                  </span>
                </div>
              </label>
            </div>

            {/* Notes */}
            <div className="form-group full-width modern">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-textarea modern"
                rows="3"
                placeholder="Notes additionnelles sur le membre..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="modal-footer team-modern">
            <button type="button" onClick={handleClose} className="btn-secondary team">
              <X size={18} />
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary team">
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save size={18} />
                  {teamMember ? 'Modifier' : 'Créer'}
                  <Sparkles size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberForm;