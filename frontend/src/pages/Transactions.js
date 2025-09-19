import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Check, 
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TransactionForm from '../components/forms/TransactionForm';
import './Transactions.css';

const Transactions = () => {
  const dispatch = useDispatch();
  const { canValidateTransactions } = usePermissions();
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Modal de création/édition
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [filters, pagination.page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      
      if (response.status === 'success') {
        setTransactions(response.data.transactions);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalItems
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.status === 'success') {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Erreur catégories:', err);
    }
  };

  const handleValidateTransaction = async (id) => {
    try {
      await transactionAPI.validate(id);
      fetchTransactions(); // Recharger la liste
    } catch (err) {
      console.error('Erreur validation:', err);
    }
  };

  const handleCancelTransaction = async (id) => {
    try {
      await transactionAPI.cancel(id, 'Annulée par l\'utilisateur');
      fetchTransactions(); // Recharger la liste
    } catch (err) {
      console.error('Erreur annulation:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleCloseForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = () => {
    fetchTransactions(); // Recharger la liste
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'en_attente': { label: 'En attente', class: 'status-warning' },
      'validee': { label: 'Validée', class: 'status-success' },
      'annulee': { label: 'Annulée', class: 'status-danger' }
    };
    return statusMap[status] || { label: status, class: 'status-info' };
  };

  const getTypeBadge = (type) => {
    return type === 'recette' 
      ? { label: 'Recette', class: 'type-recette' }
      : { label: 'Dépense', class: 'type-depense' };
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transactions-loading">
        <LoadingSpinner size="large" text="Chargement des transactions..." />
      </div>
    );
  }

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Transactions</h1>
            <p>Gestion des recettes et dépenses</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowTransactionForm(true)}
          >
            <Plus size={20} />
            Nouvelle Transaction
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <div className="search-input">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="recette">Recettes</option>
              <option value="depense">Dépenses</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="transactions-table-container">
        {error && (
          <div className="error-message">
            Erreur: {error}
          </div>
        )}

        <table className="transactions-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Description</th>
              <th>Catégorie</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="reference">{transaction.reference}</td>
                <td>{formatDate(transaction.transaction_date)}</td>
                <td className="description">{transaction.description}</td>
                <td>{transaction.category_name}</td>
                <td>
                  <span className={`type-badge ${getTypeBadge(transaction.type).class}`}>
                    {getTypeBadge(transaction.type).label}
                  </span>
                </td>
                <td className={`amount ${transaction.type === 'recette' ? 'positive' : 'negative'}`}>
                  {transaction.type === 'recette' ? '+' : '-'}{formatAmount(transaction.amount)}
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadge(transaction.status).class}`}>
                    {getStatusBadge(transaction.status).label}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="action-btn view" title="Voir détails">
                      <Eye size={16} />
                    </button>
                    
                    {transaction.status === 'en_attente' && (
                      <button 
                        className="action-btn edit" 
                        title="Modifier"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    
                    {transaction.status === 'en_attente' && canValidateTransactions && (
                      <button 
                        className="action-btn validate" 
                        title="Valider"
                        onClick={() => handleValidateTransaction(transaction.id)}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    
                    {transaction.status !== 'annulee' && (
                      <button 
                        className="action-btn cancel" 
                        title="Annuler"
                        onClick={() => handleCancelTransaction(transaction.id)}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && !loading && (
          <div className="empty-state">
            <DollarSign size={48} />
            <h3>Aucune transaction trouvée</h3>
            <p>Aucune transaction ne correspond aux critères sélectionnés.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Précédent
          </button>
          <span>
            Page {pagination.page} sur {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button 
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;