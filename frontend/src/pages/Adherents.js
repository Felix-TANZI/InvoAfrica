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
  MoreVertical
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
    toast.success(editingAdherent ? 'Adhérent modifié avec succès' : 'Adhérent créé avec succès');
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
    adherent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="adherents-loading">
        <LoadingSpinner size="large" text="Chargement des adhérents..." />
      </div>
    );
  }

  return (
    <div className="adherents-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Adhérents</h1>
            <p>Gestion des adhérents du club ({adherents.length} membres)</p>
          </div>
          {canManageUsers && (
            <button className="btn-primary" onClick={handleCreateAdherent}>
              <Plus size={20} />
              Nouvel Adhérent
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-section">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un adhérent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="stats-cards">
        <div className="stat-card active">
          <UserCheck size={24} />
          <div>
            <span className="stat-number">{adherents.filter(a => a.is_active).length}</span>
            <span className="stat-label">Actifs</span>
          </div>
        </div>
        <div className="stat-card inactive">
          <UserX size={24} />
          <div>
            <span className="stat-number">{adherents.filter(a => !a.is_active).length}</span>
            <span className="stat-label">Inactifs</span>
          </div>
        </div>
        <div className="stat-card penalty">
          <DollarSign size={24} />
          <div>
            <span className="stat-number">
              {formatAmount(adherents.reduce((sum, a) => sum + (a.penalty_amount || 0), 0))}
            </span>
            <span className="stat-label">Pénalités</span>
          </div>
        </div>
      </div>

      {/* Liste des adhérents */}
      <div className="adherents-grid">
        {filteredAdherents.map((adherent) => (
          <div key={adherent.id} className={`adherent-card ${!adherent.is_active ? 'inactive' : ''}`}>
            <div className="adherent-avatar">
              <UserPlus size={24} />
            </div>
            
            <div className="adherent-info">
              <h3>{adherent.name}</h3>
              
              <div className="adherent-details">
                {adherent.email && (
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{adherent.email}</span>
                  </div>
                )}
                
                {adherent.phone && (
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{adherent.phone}</span>
                  </div>
                )}

                <div className="detail-item">
                  <Calendar size={16} />
                  <span>Inscrit le {formatDate(adherent.registration_date)}</span>
                </div>

                {adherent.penalty_amount > 0 && (
                  <div className="detail-item penalty">
                    <DollarSign size={16} />
                    <span>Pénalités: {formatAmount(adherent.penalty_amount)}</span>
                  </div>
                )}
              </div>
              
              <div className="adherent-meta">
                <span className={`status ${adherent.is_active ? 'active' : 'inactive'}`}>
                  {adherent.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {adherent.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {adherent.notes && (
                <div className="adherent-notes">
                  <p>{adherent.notes}</p>
                </div>
              )}
            </div>
            
            {canManageUsers && (
              <div className="adherent-actions">
                <div className="actions-dropdown">
                  <button className="action-trigger">
                    <MoreVertical size={16} />
                  </button>
                  <div className="actions-menu">
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

      {/* État vide */}
      {filteredAdherents.length === 0 && !loading && (
        <div className="empty-state">
          <UserPlus size={48} />
          <h3>Aucun adhérent trouvé</h3>
          <p>
            {searchTerm 
              ? 'Aucun adhérent ne correspond à votre recherche.' 
              : 'Aucun adhérent enregistré pour le moment.'
            }
          </p>
          {canManageUsers && !searchTerm && (
            <button className="btn-primary" onClick={handleCreateAdherent}>
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