/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Plus, 
  Search, 
  Edit, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MoreVertical,
  Sparkles,
  Users,
  Award,
  Target,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdherentForm from '../components/forms/AdherentForm';
import toast from 'react-hot-toast';
import './Adherents.css';

const Adherents = () => {
  const { canManageUsers } = usePermissions();
  const [adherents, setAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  // États pour le formulaire
  const [showAdherentForm, setShowAdherentForm] = useState(false);
  const [editingAdherent, setEditingAdherent] = useState(null);

  useEffect(() => {
    fetchAdherents();
  }, []);

  const fetchAdherents = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getAdherents();
      if (response.status === 'success') {
        setAdherents(response.data.adherents);
      }
    } catch (err) {
      console.error('Erreur adherents:', err);
      toast.error('Erreur lors du chargement des adhérents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdherent = () => {
    setEditingAdherent(null);
    setShowAdherentForm(true);
  };

  const handleEditAdherent = (adherent) => {
    setEditingAdherent(adherent);
    setShowAdherentForm(true);
  };

  const handleCloseForm = () => {
    setShowAdherentForm(false);
    setEditingAdherent(null);
  };

  const handleFormSuccess = () => {
    fetchAdherents(); // Recharger la liste
  };

  const toggleAdherentStatus = async (adherent) => {
    if (!canManageUsers) {
      toast.error('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    try {
      const newStatus = !adherent.is_active;
      await memberAPI.updateAdherent(adherent.id, { is_active: newStatus });
      
      // Mettre à jour localement
      setAdherents(prev => prev.map(a => 
        a.id === adherent.id ? { ...a, is_active: newStatus } : a
      ));
      
      toast.success(`Adhérent ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      console.error('Erreur changement statut:', err);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filteredAdherents = adherents.filter(adherent =>
    adherent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adherent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adherent.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return '0 FCFA';
    }
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(numAmount)) + ' FCFA';
  };

  const formatShortAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return '0';
    }
    
    if (numAmount >= 1000000) {
      return (numAmount / 1000000).toFixed(1) + 'M';
    } else if (numAmount >= 1000) {
      return (numAmount / 1000).toFixed(0) + 'K';
    }
    return Math.round(numAmount).toString();
  };

  if (loading) {
    return (
      <div className="adherents-loading modern">
        <LoadingSpinner size="large" text="Chargement des adhérents..." />
      </div>
    );
  }

  const activeAdherents = adherents.filter(a => a.is_active).length;
  const inactiveAdherents = adherents.filter(a => !a.is_active).length;
  const totalPenalties = adherents.reduce((sum, a) => sum + (a.penalty_amount || 0), 0);

  return (
    <div className="adherents-page modern">
      {/* Header moderne */}
      <div className="page-header modern">
        <div className="header-content modern">
          <div className="header-text">
            <h1 className="page-title">Adhérents</h1>
            <p className="page-subtitle">
              Gestion des adhérents du club
              <span className="member-count-badge">
                <Award size={12} />
                {adherents.length} membres
              </span>
            </p>
          </div>
          
          {canManageUsers && (
            <button className="btn-primary modern" onClick={handleCreateAdherent}>
              <Plus size={20} />
              Nouvel Adhérent
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche moderne */}
      <div className="search-section modern">
        <div className="search-container modern">
          <div className={`search-input modern ${searchFocused ? 'focused' : ''}`}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un adhérent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>
      </div>

      {/* Statistiques rapides modernes */}
      <div className="stats-cards modern">
        <div className="stat-card modern active">
          <div className="stat-card-content">
            <div className="stat-icon modern active">
              <UserCheck size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number modern">{activeAdherents}</span>
              <span className="stat-label modern">Membres actifs</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card modern inactive">
          <div className="stat-card-content">
            <div className="stat-icon modern inactive">
              <UserX size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number modern">{inactiveAdherents}</span>
              <span className="stat-label modern">Membres inactifs</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card modern penalty">
          <div className="stat-card-content">
            <div className="stat-icon modern penalty">
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number modern">{formatShortAmount(totalPenalties)}</span>
              <span className="stat-label modern">Pénalités totales</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      {/* Liste des adhérents moderne */}
      <div className="adherents-grid modern">
        {filteredAdherents.map((adherent, index) => (
          <div 
            key={adherent.id} 
            className={`adherent-card modern ${!adherent.is_active ? 'inactive' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="adherent-avatar modern">
              <UserPlus size={24} />
            </div>
            
            <div className="adherent-info">
              <h3>{adherent.name}</h3>
              
              <div className="adherent-details modern">
                {adherent.email && (
                  <div className="detail-item modern">
                    <Mail size={16} />
                    <span>{adherent.email}</span>
                  </div>
                )}
                
                {adherent.phone && (
                  <div className="detail-item modern">
                    <Phone size={16} />
                    <span>{adherent.phone}</span>
                  </div>
                )}

                <div className="detail-item modern">
                  <Calendar size={16} />
                  <span>Inscrit le {formatDate(adherent.registration_date)}</span>
                </div>

                {adherent.profession && (
                  <div className="detail-item modern">
                    <Award size={16} />
                    <span>{adherent.profession}</span>
                  </div>
                )}

                {adherent.penalty_amount > 0 && (
                  <div className="detail-item modern penalty">
                    <DollarSign size={16} />
                    <span>Pénalités: {formatAmount(adherent.penalty_amount)}</span>
                  </div>
                )}
              </div>
              
              <div className="adherent-meta modern">
                <span className={`status modern ${adherent.is_active ? 'active' : 'inactive'}`}>
                  {adherent.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {adherent.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {adherent.notes && (
                <div className="adherent-notes modern">
                  <p>{adherent.notes}</p>
                </div>
              )}
            </div>
            
            {canManageUsers && (
              <div className="adherent-actions modern">
                <div className="actions-dropdown modern">
                  <button className="action-trigger modern">
                    <MoreVertical size={16} />
                  </button>
                  <div className="actions-menu modern">
                    <button onClick={() => handleEditAdherent(adherent)}>
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button onClick={() => toggleAdherentStatus(adherent)}>
                      {adherent.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      {adherent.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* État vide moderne */}
      {filteredAdherents.length === 0 && !loading && (
        <div className="empty-state modern">
          <UserPlus size={64} />
          <h3>Aucun adhérent trouvé</h3>
          <p>
            {searchTerm 
              ? 'Aucun adhérent ne correspond à votre recherche. Essayez avec d\'autres mots-clés.' 
              : 'Aucun adhérent enregistré pour le moment. Commencez par ajouter votre premier adhérent.'
            }
          </p>
          {canManageUsers && !searchTerm && (
            <button className="btn-primary modern" onClick={handleCreateAdherent}>
              <Plus size={20} />
              Ajouter le premier adhérent
            </button>
          )}
        </div>
      )}

      {/* Formulaire de création/édition */}
      <AdherentForm
        isOpen={showAdherentForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        adherent={editingAdherent}
      />
    </div>
  );
};

export default Adherents;