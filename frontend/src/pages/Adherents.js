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
  Phone
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Adherents.css';

const Adherents = () => {
  const { canManageUsers } = usePermissions();
  const [adherents, setAdherents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const filteredAdherents = adherents.filter(adherent =>
    adherent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
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
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Adhérents</h1>
            <p>Gestion des adhérents du club</p>
          </div>
          {canManageUsers && (
            <button className="btn-primary">
              <Plus size={20} />
              Nouvel Adhérent
            </button>
          )}
        </div>
      </div>

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

      <div className="adherents-grid">
        {filteredAdherents.map((adherent) => (
          <div key={adherent.id} className="adherent-card">
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
              </div>
              
              <div className="adherent-meta">
                <span>Inscrit le {formatDate(adherent.registration_date)}</span>
                <span className={`status ${adherent.is_active ? 'active' : 'inactive'}`}>
                  {adherent.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {adherent.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            
            {canManageUsers && (
              <div className="adherent-actions">
                <button className="action-btn edit">
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAdherents.length === 0 && (
        <div className="empty-state">
          <UserPlus size={48} />
          <h3>Aucun adhérent trouvé</h3>
          <p>Aucun adhérent ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
};

export default Adherents;