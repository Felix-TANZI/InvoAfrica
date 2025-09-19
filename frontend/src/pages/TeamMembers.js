/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
import './TeamMembers.css';

const TeamMembers = () => {
  const { canManageUsers } = usePermissions();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getTeamMembers();
      if (response.status === 'success') {
        setTeamMembers(response.data.team_members);
      }
    } catch (err) {
      console.error('Erreur team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="team-members-loading">
        <LoadingSpinner size="large" text="Chargement des membres..." />
      </div>
    );
  }

  return (
    <div className="team-members-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Team Members</h1>
            <p>Gestion des membres du bureau</p>
          </div>
          {canManageUsers && (
            <button className="btn-primary">
              <Plus size={20} />
              Nouveau Membre
            </button>
          )}
        </div>
      </div>

      <div className="search-section">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="members-grid">
        {filteredMembers.map((member) => (
          <div key={member.id} className="member-card">
            <div className="member-avatar">
              <Users size={24} />
            </div>
            
            <div className="member-info">
              <h3>{member.name}</h3>
              <p className="position">{member.position || 'Membre'}</p>
              
              <div className="member-details">
                {member.email && (
                  <div className="detail-item">
                    <Mail size={16} />
                    <span>{member.email}</span>
                  </div>
                )}
                
                {member.phone && (
                  <div className="detail-item">
                    <Phone size={16} />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="member-meta">
                <span>Inscrit le {formatDate(member.registration_date)}</span>
                <span className={`status ${member.is_active ? 'active' : 'inactive'}`}>
                  {member.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                  {member.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            
            {canManageUsers && (
              <div className="member-actions">
                <button className="action-btn edit">
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>Aucun membre trouvé</h3>
          <p>Aucun membre ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;