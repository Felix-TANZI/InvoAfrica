/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


import React, { useState, useEffect } from 'react';
import { X, Save, Users } from 'lucide-react';
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

  // Postes prédéfinis du bureau
  const positions = [
    'Président',
    'Vice-Président',
    'Conseiller spécial',
    'Secrétaire Général',
    'Secrétaire Général Adjoint',
    'Chef Cellule Financière',
    'Trésorier',
    'Censeur',
    'Chef cellule communication',
    'Ambassadrice',
    'Chef cellule projet',
    'Secrétaire particulier',
    'Chef cellule formation',
    'Assistant Backend',
    'Chef cellule compétition',
    'Chargé des relations externes',
    'Chargé des relations internes',
    'Directeur de Publication du Hello World',
    'Membre'
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
    }
  }, [isOpen, teamMember]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Le poste est requis';
    }

    if (!formData.registration_date) {
      newErrors.registration_date = 'La date d\'inscription est requise';
    }

    if (formData.penalty_amount < 0) {
      newErrors.penalty_amount = 'Le montant des pénalités ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^(\+237|237)?[2368]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Supprimer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Users size={24} />
            <h2>{teamMember ? 'Modifier le Membre' : 'Nouveau Membre du Bureau'}</h2>
          </div>
          <button className="modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="team-member-form">
          <div className="form-grid">
            {/* Nom */}
            <div className="form-group">
              <label htmlFor="name">Nom complet *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="Entrez le nom complet"
                required
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Poste */}
            <div className="form-group">
              <label htmlFor="position">Poste dans le bureau *</label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className={errors.position ? 'error' : ''}
                required
              >
                <option value="">Sélectionnez un poste</option>
                {positions.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              {errors.position && <span className="error-message">{errors.position}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="exemple@email.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Téléphone */}
            <div className="form-group">
              <label htmlFor="phone">Téléphone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={errors.phone ? 'error' : ''}
                placeholder="+237 6XX XXX XXX"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            {/* Date d'inscription */}
            <div className="form-group">
              <label htmlFor="registration_date">Date d'entrée au bureau *</label>
              <input
                type="date"
                id="registration_date"
                name="registration_date"
                value={formData.registration_date}
                onChange={handleInputChange}
                className={errors.registration_date ? 'error' : ''}
                required
              />
              {errors.registration_date && <span className="error-message">{errors.registration_date}</span>}
            </div>

            {/* Statut actif */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom"></span>
                Membre actif du bureau
              </label>
            </div>

            {/* Montant des pénalités */}
            <div className="form-group">
              <label htmlFor="penalty_amount">Pénalités (FCFA)</label>
              <input
                type="number"
                id="penalty_amount"
                name="penalty_amount"
                value={formData.penalty_amount}
                onChange={handleInputChange}
                className={errors.penalty_amount ? 'error' : ''}
                min="0"
                step="1"
                placeholder="0"
              />
              {errors.penalty_amount && <span className="error-message">{errors.penalty_amount}</span>}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Notes additionnelles sur le membre..."
            />
          </div>

          {/* Boutons d'action */}
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save size={18} />
                  {teamMember ? 'Modifier' : 'Créer'}
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