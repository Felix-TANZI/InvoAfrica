/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Amélioration: Gestion avancée des paiements
*/

import React, { useState } from 'react';
import { X, Save, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { contributionAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import './ContributionPaymentForm.css';

const ContributionPaymentForm = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  contribution = null,
  type = 'team' // 'team' ou 'adherent'
}) => {
  const [paymentData, setPaymentData] = useState({
    amount: contribution?.amount || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash',
    is_partial: false,
    partial_amount: 0,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    
    setPaymentData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const submitData = {
        payment_date: paymentData.payment_date,
        payment_mode: paymentData.payment_mode,
        notes: paymentData.notes
      };

      // Si c'est un paiement partiel, ajuster le montant
      if (paymentData.is_partial) {
        submitData.partial_amount = parseFloat(paymentData.partial_amount);
      }

      if (type === 'team') {
        await contributionAPI.markTeamPaid(contribution.id, submitData);
      } else {
        await contributionAPI.markAdherentPaid(contribution.id, submitData);
      }
      
      toast.success('Paiement enregistré avec succès');
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Erreur paiement:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (!isOpen || !contribution) return null;

  const memberName = type === 'team' ? contribution.member_name : contribution.adherent_name;
  const remainingAmount = contribution.amount - (contribution.amount_paid || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <DollarSign size={24} />
            <h2>Enregistrer un Paiement</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="payment-summary">
          <h3>{memberName}</h3>
          <div className="amount-breakdown">
            <div className="amount-item">
              <span>Montant total:</span>
              <strong>{formatAmount(contribution.amount)}</strong>
            </div>
            {contribution.amount_paid > 0 && (
              <div className="amount-item paid">
                <span>Déjà payé:</span>
                <strong>{formatAmount(contribution.amount_paid)}</strong>
              </div>
            )}
            <div className="amount-item remaining">
              <span>Restant:</span>
              <strong>{formatAmount(remainingAmount)}</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="payment_date">Date de paiement *</label>
              <input
                type="date"
                id="payment_date"
                name="payment_date"
                value={paymentData.payment_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="payment_mode">Mode de paiement *</label>
              <select
                id="payment_mode"
                name="payment_mode"
                value={paymentData.payment_mode}
                onChange={handleInputChange}
                required
              >
                <option value="cash">Espèces</option>
                <option value="om">Orange Money</option>
                <option value="momo">MTN Mobile Money</option>
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
              </select>
            </div>
          </div>

          {/* Paiement partiel */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_partial"
                checked={paymentData.is_partial}
                onChange={handleInputChange}
              />
              <span className="checkbox-custom"></span>
              Paiement partiel (avance)
            </label>
          </div>

          {paymentData.is_partial && (
            <div className="form-group">
              <label htmlFor="partial_amount">Montant de l'avance *</label>
              <input
                type="number"
                id="partial_amount"
                name="partial_amount"
                value={paymentData.partial_amount}
                onChange={handleInputChange}
                min="1"
                max={remainingAmount}
                step="1"
                placeholder="Montant de l'avance"
                required={paymentData.is_partial}
              />
              <small>Maximum: {formatAmount(remainingAmount)}</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={paymentData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributionPaymentForm;