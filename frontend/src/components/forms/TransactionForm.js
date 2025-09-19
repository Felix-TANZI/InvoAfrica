/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { transactionAPI, categoryAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
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

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      
      // Si c'est une édition, pré-remplir le formulaire
      if (transaction) {
        setFormData({
          category_id: transaction.category_id,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          transaction_date: transaction.transaction_date,
          payment_mode: transaction.payment_mode,
          contact_person: transaction.contact_person || '',
          notes: transaction.notes || ''
        });
      }
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
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitLoading(true);
      
      if (transaction) {
        // Édition
        await transactionAPI.update(transaction.id, formData);
      } else {
        // Création
        await transactionAPI.create(formData);
      }
      
      onSuccess();
      onClose();
      
      // Reset form
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
      
    } catch (err) {
      console.error('Erreur sauvegarde transaction:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{transaction ? 'Modifier la Transaction' : 'Nouvelle Transaction'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading">
            <LoadingSpinner size="medium" text="Chargement..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="recette">Recette</option>
                  <option value="depense">Dépense</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category_id">Catégorie *</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Montant (FCFA) *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="transaction_date">Date *</label>
                <input
                  type="date"
                  id="transaction_date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment_mode">Mode de Paiement *</label>
                <select
                  id="payment_mode"
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cash">Espèces</option>
                  <option value="om">Orange Money</option>
                  <option value="momo">MTN Mobile Money</option>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact_person">Personne Concernée</label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  placeholder="Nom de la personne (optionnel)"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Décrivez la transaction..."
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                placeholder="Notes additionnelles (optionnel)"
              />
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-secondary">
                Annuler
              </button>
              <button type="submit" disabled={submitLoading} className="btn-primary">
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
          </form>
        )}
      </div>
    </div>
  );
};

export default TransactionForm;