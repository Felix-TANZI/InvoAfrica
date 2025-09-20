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
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  CreditCard,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Calculator,
  Tags,
  MessageSquare
} from 'lucide-react';
import { transactionAPI, categoryAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './TransactionForm.css';

const TransactionForm = ({ isOpen, onClose, onSuccess, transaction = null }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    type: 'recette',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash',
    contact_person: '',
    notes: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      
      if (transaction) {
        // Mode édition
        setFormData({
          category_id: transaction.category_id || '',
          amount: transaction.amount || '',
          type: transaction.type || 'recette',
          description: transaction.description || '',
          transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
          payment_mode: transaction.payment_mode || 'cash',
          contact_person: transaction.contact_person || '',
          notes: transaction.notes || ''
        });
      } else {
        // Mode création - reset
        setFormData({
          category_id: '',
          amount: '',
          type: 'recette',
          description: '',
          transaction_date: new Date().toISOString().split('T')[0],
          payment_mode: 'cash',
          contact_person: '',
          notes: ''
        });
      }
      
      setErrors({});
      setStep(1);
      setShowPreview(false);
    }
  }, [isOpen, transaction]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      if (response.status === 'success') {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Erreur catégories:', err);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      // Validation étape 1 : Type et montant
      if (!formData.type) {
        newErrors.type = 'Le type est requis';
      }
      
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Le montant doit être supérieur à 0';
      }
      
      if (!formData.category_id) {
        newErrors.category_id = 'La catégorie est requise';
      }
    }

    if (currentStep === 2) {
      // Validation étape 2 : Détails
      if (!formData.description || formData.description.trim().length < 5) {
        newErrors.description = 'La description doit contenir au moins 5 caractères';
      }
      
      if (!formData.transaction_date) {
        newErrors.transaction_date = 'La date est requise';
      }
      
      if (!formData.payment_mode) {
        newErrors.payment_mode = 'Le mode de paiement est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Supprimer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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
    if (validateStep(2)) {
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
      setSubmitLoading(true);
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        contact_person: formData.contact_person?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      if (transaction) {
        await transactionAPI.update(transaction.id, submitData);
        toast.success('Transaction modifiée avec succès');
      } else {
        await transactionAPI.create(submitData);
        toast.success('Transaction créée avec succès');
      }
      
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Erreur sauvegarde transaction:', err);
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      category_id: '',
      amount: '',
      type: 'recette',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_mode: 'cash',
      contact_person: '',
      notes: ''
    });
    setErrors({});
    setStep(1);
    setShowPreview(false);
    onClose();
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR').format(numAmount) + ' FCFA';
  };

  const getPaymentModeLabel = (mode) => {
    const modes = {
      'cash': 'Espèces',
      'om': 'Orange Money',
      'momo': 'MTN Mobile Money',
      'virement': 'Virement bancaire',
      'cheque': 'Chèque'
    };
    return modes[mode] || mode;
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay modern" onClick={handleClose}>
      <div className="modal-content modern" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header modern">
          <div className="modal-title">
            <div className="title-icon">
              <DollarSign size={24} />
            </div>
            <div className="title-content">
              <h2>{transaction ? 'Modifier la Transaction' : 'Nouvelle Transaction'}</h2>
              <p>{showPreview ? 'Aperçu de la transaction' : `Étape ${step} sur 2`}</p>
            </div>
          </div>
          <button className="modal-close modern" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        {!showPreview && (
          <div className="progress-container">
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <span>Montant & Type</span>
              </div>
              <div className="progress-line">
                <div className={`progress-fill ${step > 1 ? 'completed' : ''}`}></div>
              </div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span>Détails</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="modal-loading">
            <LoadingSpinner size="medium" text="Chargement..." />
          </div>
        ) : showPreview ? (
          /* Preview Mode */
          <div className="preview-container">
            <div className="preview-card">
              <div className="preview-header">
                <div className={`preview-type ${formData.type}`}>
                  {formData.type === 'recette' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  <span>{formData.type === 'recette' ? 'Recette' : 'Dépense'}</span>
                </div>
                <div className="preview-amount">
                  {formData.type === 'recette' ? '+' : '-'}{formatAmount(formData.amount)}
                </div>
              </div>

              <div className="preview-details">
                <div className="preview-item">
                  <FileText size={16} />
                  <span>Description</span>
                  <strong>{formData.description}</strong>
                </div>
                
                <div className="preview-item">
                  <Tags size={16} />
                  <span>Catégorie</span>
                  <strong>{categories.find(c => c.id === parseInt(formData.category_id))?.name}</strong>
                </div>
                
                <div className="preview-item">
                  <Calendar size={16} />
                  <span>Date</span>
                  <strong>{new Date(formData.transaction_date).toLocaleDateString('fr-FR')}</strong>
                </div>
                
                <div className="preview-item">
                  <CreditCard size={16} />
                  <span>Mode de paiement</span>
                  <strong>{getPaymentModeLabel(formData.payment_mode)}</strong>
                </div>

                {formData.contact_person && (
                  <div className="preview-item">
                    <User size={16} />
                    <span>Personne concernée</span>
                    <strong>{formData.contact_person}</strong>
                  </div>
                )}

                {formData.notes && (
                  <div className="preview-item">
                    <MessageSquare size={16} />
                    <span>Notes</span>
                    <strong>{formData.notes}</strong>
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
                disabled={submitLoading} 
                className="btn-primary"
              >
                {submitLoading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <Save size={18} />
                    {transaction ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Form Steps */
          <form onSubmit={handleSubmit} className="transaction-form modern">
            {step === 1 && (
              <div className="form-step active">
                <div className="step-header">
                  <Calculator size={20} />
                  <h3>Montant et Type</h3>
                  <p>Définissez le montant et le type de transaction</p>
                </div>

                <div className="form-grid">
                  {/* Type de transaction */}
                  <div className="form-group full-width">
                    <label>Type de transaction *</label>
                    <div className="type-selector">
                      <button
                        type="button"
                        className={`type-option ${formData.type === 'recette' ? 'active' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'type', value: 'recette' } })}
                      >
                        <TrendingUp size={20} />
                        <span>Recette</span>
                        <div className="type-description">Argent entrant</div>
                      </button>
                      <button
                        type="button"
                        className={`type-option ${formData.type === 'depense' ? 'active' : ''}`}
                        onClick={() => handleInputChange({ target: { name: 'type', value: 'depense' } })}
                      >
                        <TrendingDown size={20} />
                        <span>Dépense</span>
                        <div className="type-description">Argent sortant</div>
                      </button>
                    </div>
                    {errors.type && <span className="error-message">{errors.type}</span>}
                  </div>

                  {/* Montant */}
                  <div className="form-group">
                    <label htmlFor="amount">Montant (FCFA) *</label>
                    <div className="amount-input-container">
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        className={`amount-input ${errors.amount ? 'error' : ''}`}
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <div className="amount-preview">
                        {formData.amount && formatAmount(formData.amount)}
                      </div>
                    </div>
                    {errors.amount && <span className="error-message">{errors.amount}</span>}
                  </div>

                  {/* Catégorie */}
                  <div className="form-group">
                    <label htmlFor="category_id">Catégorie *</label>
                    <div className="select-container">
                      <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className={`form-select ${errors.category_id ? 'error' : ''}`}
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {filteredCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <Tags size={16} className="select-icon" />
                    </div>
                    {errors.category_id && <span className="error-message">{errors.category_id}</span>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step active">
                <div className="step-header">
                  <FileText size={20} />
                  <h3>Détails de la Transaction</h3>
                  <p>Ajoutez les informations complémentaires</p>
                </div>

                <div className="form-grid">
                  {/* Description */}
                  <div className="form-group full-width">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`form-textarea ${errors.description ? 'error' : ''}`}
                      rows="3"
                      placeholder="Décrivez la transaction..."
                    />
                    {errors.description && <span className="error-message">{errors.description}</span>}
                  </div>

                  {/* Date */}
                  <div className="form-group">
                    <label htmlFor="transaction_date">Date *</label>
                    <div className="input-container">
                      <input
                        type="date"
                        id="transaction_date"
                        name="transaction_date"
                        value={formData.transaction_date}
                        onChange={handleInputChange}
                        className={`form-input ${errors.transaction_date ? 'error' : ''}`}
                      />
                      <Calendar size={16} className="input-icon" />
                    </div>
                    {errors.transaction_date && <span className="error-message">{errors.transaction_date}</span>}
                  </div>

                  {/* Mode de paiement */}
                  <div className="form-group">
                    <label htmlFor="payment_mode">Mode de Paiement *</label>
                    <div className="select-container">
                      <select
                        id="payment_mode"
                        name="payment_mode"
                        value={formData.payment_mode}
                        onChange={handleInputChange}
                        className={`form-select ${errors.payment_mode ? 'error' : ''}`}
                      >
                        <option value="cash">Espèces</option>
                        <option value="om">Orange Money</option>
                        <option value="momo">MTN Mobile Money</option>
                        <option value="virement">Virement bancaire</option>
                        <option value="cheque">Chèque</option>
                      </select>
                      <CreditCard size={16} className="select-icon" />
                    </div>
                    {errors.payment_mode && <span className="error-message">{errors.payment_mode}</span>}
                  </div>

                  {/* Personne concernée */}
                  <div className="form-group">
                    <label htmlFor="contact_person">Personne Concernée</label>
                    <div className="input-container">
                      <input
                        type="text"
                        id="contact_person"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Nom de la personne (optionnel)"
                      />
                      <User size={16} className="input-icon" />
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
                      className="form-textarea"
                      rows="2"
                      placeholder="Notes additionnelles (optionnel)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="modal-footer modern">
              {step === 1 ? (
                <>
                  <button type="button" onClick={handleClose} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="button" onClick={handleNextStep} className="btn-primary">
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
                  <button type="submit" disabled={submitLoading} className="btn-primary">
                    {submitLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <Save size={16} />
                        {transaction ? 'Modifier' : 'Créer'}
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

export default TransactionForm;