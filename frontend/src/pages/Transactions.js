/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - AVEC PDF

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

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
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Download,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import { transactionAPI, categoryAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TransactionForm from '../components/forms/TransactionForm';
import PdfExportButtons, { QuickPdfAction } from '../components/pdf/PdfExportButton';
import toast from 'react-hot-toast';
import './Transactions.css';

const Transactions = () => {
  const dispatch = useDispatch();
  const { canValidateTransactions } = usePermissions();
  
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'cards'
  
  // État pour les statistiques globales
  const [statistics, setStatistics] = useState({
    total: 0,
    recettes: 0,
    depenses: 0,
    en_attente: 0,
    validee: 0,
    montant_recettes: 0,
    montant_depenses: 0,
    solde: 0
  });
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    category: '', // Sera mappé à category_id
    dateFrom: '', // Sera mappé à date_from
    dateTo: '',   // Sera mappé à date_to
    amountMin: '', // Sera mappé à amount_min
    amountMax: ''  // Sera mappé à amount_max
  });
  
  // Tri
  const [sortBy, setSortBy] = useState('transaction_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
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
  }, [filters, pagination.page, sortBy, sortOrder]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Mapper correctement les paramètres pour le backend
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        category_id: filters.category || undefined, 
        date_from: filters.dateFrom || undefined,    
        date_to: filters.dateTo || undefined,        
        amount_min: filters.amountMin || undefined,  
        amount_max: filters.amountMax || undefined   
      };

      // Nettoyer les undefined
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      console.log('📤 Envoi des paramètres:', params);
      
      const response = await transactionAPI.getAll(params);
      
      console.log('📥 Réponse API:', response);
      
      if (response.status === 'success') {
        setTransactions(response.data.transactions);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.totalItems
        }));
        
        // Utiliser les statistiques globales de l'API
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
          console.log('📊 Statistiques reçues:', response.data.statistics);
        }
        
        setError(null);
      }
    } catch (err) {
      console.error('❌ Erreur fetch transactions:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des transactions');
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
      toast.success('Transaction validée avec succès');
      fetchTransactions();
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de la validation');
    }
  };

  const handleCancelTransaction = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette transaction ?')) {
      return;
    }
    
    try {
      await transactionAPI.cancel(id, 'Annulée par l\'utilisateur');
      toast.success('Transaction annulée avec succès');
      fetchTransactions();
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleFilterChange = (key, value) => {
    console.log(`🔄 Filtre changé: ${key} = ${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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
    fetchTransactions();
    handleCloseForm();
  };

  const clearFilters = () => {
    console.log('🧹 Effacement des filtres');
    setFilters({
      search: '',
      status: '',
      type: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'en_attente': { 
        label: 'En attente', 
        class: 'status-warning',
        icon: Clock,
        color: '#f59e0b'
      },
      'validee': { 
        label: 'Validée', 
        class: 'status-success',
        icon: CheckCircle,
        color: '#10b981'
      },
      'annulee': { 
        label: 'Annulée', 
        class: 'status-danger',
        icon: AlertCircle,
        color: '#ef4444'
      }
    };
    return statusMap[status] || { 
      label: status, 
      class: 'status-info',
      icon: FileText,
      color: '#3b82f6'
    };
  };

  const getTypeInfo = (type) => {
    return type === 'recette' 
      ? { 
          label: 'Recette', 
          class: 'type-recette',
          icon: TrendingUp,
          color: '#10b981'
        }
      : { 
          label: 'Dépense', 
          class: 'type-depense',
          icon: TrendingDown,
          color: '#ef4444'
        };
  };

  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(numAmount)) + ' FCFA';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasFilters = Object.values(filters).some(value => value !== '');

  if (loading && transactions.length === 0) {
    return (
      <div className="transactions-loading modern">
        <LoadingSpinner size="large" text="Chargement des transactions..." />
      </div>
    );
  }

  return (
    <div className="transactions-page modern">
      {/* Header moderne */}
      <div className="page-header modern">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">
              Gestion des recettes et dépenses • {pagination.total} transaction{pagination.total > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="header-actions">
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vue tableau"
              >
                <List size={18} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Vue cartes"
              >
                <Grid size={18} />
              </button>
            </div>

            <button className="btn-secondary" onClick={fetchTransactions} title="Actualiser">
              <RefreshCw size={18} />
              Actualiser
            </button>

            {/* ✨ NOUVEAU - Bouton PDF Export */}
            <PdfExportButtons 
              variant="transaction-list"
              filters={filters}
            />
            
            <button 
              className="btn-primary"
              onClick={() => setShowTransactionForm(true)}
            >
              <Plus size={18} />
              Nouvelle Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Stats globales provenant de l'API */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon total">
            <FileText size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon recettes">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics.recettes}</span>
            <span className="stat-label">Recettes</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon depenses">
            <TrendingDown size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics.depenses}</span>
            <span className="stat-label">Dépenses</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{statistics.en_attente}</span>
            <span className="stat-label">En attente</span>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="filters-section modern">
        <div className="filters-header">
          <div className="filters-title">
            <Filter size={20} />
            <span>Filtres</span>
            {hasFilters && (
              <span className="filter-count">{Object.values(filters).filter(v => v !== '').length}</span>
            )}
          </div>
          {hasFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              Effacer tous
            </button>
          )}
        </div>

        <div className="filters-grid">
          {/* Recherche */}
          <div className="filter-group search-group">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher dans les transactions..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Statut */}
          <div className="filter-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          {/* Type */}
          <div className="filter-group">
            <label>Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="recette">Recettes</option>
              <option value="depense">Dépenses</option>
            </select>
          </div>

          {/* Catégorie */}
          <div className="filter-group">
            <label>Catégorie</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date de début */}
          <div className="filter-group">
            <label>Date de début</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Date de fin */}
          <div className="filter-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Montant minimum */}
          <div className="filter-group">
            <label>Montant min (FCFA)</label>
            <input
              type="number"
              value={filters.amountMin}
              onChange={(e) => handleFilterChange('amountMin', e.target.value)}
              className="filter-input"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Montant maximum */}
          <div className="filter-group">
            <label>Montant max (FCFA)</label>
            <input
              type="number"
              value={filters.amountMax}
              onChange={(e) => handleFilterChange('amountMax', e.target.value)}
              className="filter-input"
              placeholder="Illimité"
              min="0"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>Erreur: {error}</span>
          <button onClick={() => setError(null)} className="close-error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="transactions-content">
        {viewMode === 'table' ? (
          <TransactionTable 
            transactions={transactions}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onEdit={handleEditTransaction}
            onValidate={handleValidateTransaction}
            onCancel={handleCancelTransaction}
            canValidate={canValidateTransactions}
            formatAmount={formatAmount}
            formatDate={formatDate}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
          />
        ) : (
          <TransactionCards 
            transactions={transactions}
            onEdit={handleEditTransaction}
            onValidate={handleValidateTransaction}
            onCancel={handleCancelTransaction}
            canValidate={canValidateTransactions}
            formatAmount={formatAmount}
            formatDate={formatDate}
            getStatusInfo={getStatusInfo}
            getTypeInfo={getTypeInfo}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination modern">
            <button 
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            
            <div className="pagination-info">
              <span>
                Page {pagination.page} sur {totalPages}
              </span>
              <span className="pagination-details">
                {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
              </span>
            </div>
            
            <button 
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="pagination-btn"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* État vide */}
        {transactions.length === 0 && !loading && (
          <div className="empty-state modern">
            <div className="empty-icon">
              <DollarSign size={64} />
              <Sparkles size={24} className="sparkle" />
            </div>
            <h3>Aucune transaction trouvée</h3>
            <p>
              {hasFilters 
                ? 'Aucune transaction ne correspond aux critères sélectionnés.'
                : 'Commencez par créer votre première transaction.'
              }
            </p>
            {!hasFilters && (
              <button 
                className="btn-primary"
                onClick={() => setShowTransactionForm(true)}
              >
                <Plus size={20} />
                Créer une transaction
              </button>
            )}
          </div>
        )}
      </div>

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


// COMPOSANT TABLE

const TransactionTable = ({ 
  transactions, 
  onSort, 
  sortBy, 
  sortOrder, 
  onEdit, 
  onValidate, 
  onCancel, 
  canValidate,
  formatAmount,
  formatDate,
  getStatusInfo,
  getTypeInfo
}) => (
  <div className="transactions-table-container modern">
    <div className="table-wrapper">
      <table className="transactions-table modern">
        <thead>
          <tr>
            <th onClick={() => onSort('reference')} className="sortable">
              <span>
                Référence
                <ArrowUpDown size={14} className={sortBy === 'reference' ? 'active' : ''} />
              </span>
            </th>
            <th onClick={() => onSort('transaction_date')} className="sortable">
              <span>
                Date
                <ArrowUpDown size={14} className={sortBy === 'transaction_date' ? 'active' : ''} />
              </span>
            </th>
            <th>Description</th>
            <th>Catégorie</th>
            <th onClick={() => onSort('type')} className="sortable">
              <span>
                Type
                <ArrowUpDown size={14} className={sortBy === 'type' ? 'active' : ''} />
              </span>
            </th>
            <th onClick={() => onSort('amount')} className="sortable">
              <span>
                Montant
                <ArrowUpDown size={14} className={sortBy === 'amount' ? 'active' : ''} />
              </span>
            </th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const statusInfo = getStatusInfo(transaction.status);
            const typeInfo = getTypeInfo(transaction.type);
            const StatusIcon = statusInfo.icon;
            const TypeIcon = typeInfo.icon;

            return (
              <tr key={transaction.id} className="transaction-row">
                <td className="reference">
                  <code>{transaction.reference}</code>
                </td>
                <td>{formatDate(transaction.transaction_date)}</td>
                <td className="description">
                  <span title={transaction.description}>
                    {transaction.description}
                  </span>
                </td>
                <td>{transaction.category_name}</td>
                <td>
                  <div className={`type-badge ${typeInfo.class}`}>
                    <TypeIcon size={14} />
                    <span>{typeInfo.label}</span>
                  </div>
                </td>
                <td className={`amount ${transaction.type === 'recette' ? 'positive' : 'negative'}`}>
                  {transaction.type === 'recette' ? '+' : '-'}{formatAmount(transaction.amount)}
                </td>
                <td>
                  <div className={`status-badge ${statusInfo.class}`}>
                    <StatusIcon size={14} />
                    <span>{statusInfo.label}</span>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <button className="action-btn view" title="Voir détails">
                      <Eye size={14} />
                    </button>
                    
                    {/* ✨ NOUVEAU - Bouton PDF rapide pour transactions validées */}
                    {transaction.status === 'validee' && (
                      <QuickPdfAction 
                        transactionId={transaction.id}
                        status={transaction.status}
                      />
                    )}
                    
                    {transaction.status === 'en_attente' && (
                      <button 
                        className="action-btn edit" 
                        title="Modifier"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    
                    {transaction.status === 'en_attente' && canValidate && (
                      <button 
                        className="action-btn validate" 
                        title="Valider"
                        onClick={() => onValidate(transaction.id)}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    
                    {transaction.status !== 'annulee' && (
                      <button 
                        className="action-btn cancel" 
                        title="Annuler"
                        onClick={() => onCancel(transaction.id)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);


// COMPOSANT CARDS

const TransactionCards = ({ 
  transactions, 
  onEdit, 
  onValidate, 
  onCancel, 
  canValidate,
  formatAmount,
  formatDate,
  getStatusInfo,
  getTypeInfo
}) => (
  <div className="transactions-cards">
    {transactions.map((transaction) => {
      const statusInfo = getStatusInfo(transaction.status);
      const typeInfo = getTypeInfo(transaction.type);
      const StatusIcon = statusInfo.icon;
      const TypeIcon = typeInfo.icon;

      return (
        <div key={transaction.id} className={`transaction-card ${statusInfo.class}`}>
          <div className="card-header">
            <div className="card-reference">
              <code>{transaction.reference}</code>
            </div>
            <div className="card-actions">
              <button className="card-action-btn">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="card-content">
            <div className="card-amount">
              <span className={`amount ${transaction.type === 'recette' ? 'positive' : 'negative'}`}>
                {transaction.type === 'recette' ? '+' : '-'}{formatAmount(transaction.amount)}
              </span>
            </div>

            <div className="card-description">
              {transaction.description}
            </div>

            <div className="card-meta">
              <div className="meta-item">
                <Calendar size={14} />
                <span>{formatDate(transaction.transaction_date)}</span>
              </div>
              <div className="meta-item">
                <span>{transaction.category_name}</span>
              </div>
            </div>

            <div className="card-badges">
              <div className={`type-badge ${typeInfo.class}`}>
                <TypeIcon size={14} />
                <span>{typeInfo.label}</span>
              </div>
              <div className={`status-badge ${statusInfo.class}`}>
                <StatusIcon size={14} />
                <span>{statusInfo.label}</span>
              </div>
            </div>
          </div>

          <div className="card-actions-footer">
            <button className="action-btn view">
              <Eye size={14} />
              Voir
            </button>
            
            {/* ✨ NOUVEAU - Bouton reçu pour transactions validées */}
            {transaction.status === 'validee' && (
              <PdfExportButtons 
                variant="receipt"
                transactionId={transaction.id}
              />
            )}
            
            {transaction.status === 'en_attente' && (
              <button 
                className="action-btn edit"
                onClick={() => onEdit(transaction)}
              >
                <Edit size={14} />
                Modifier
              </button>
            )}
            
            {transaction.status === 'en_attente' && canValidate && (
              <button 
                className="action-btn validate"
                onClick={() => onValidate(transaction.id)}
              >
                <Check size={14} />
                Valider
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default Transactions;