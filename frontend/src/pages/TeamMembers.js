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
  Phone,
  Calendar,
  DollarSign,
  MoreVertical,
  Crown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { memberAPI, contributionAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TeamMemberForm from '../components/forms/TeamMemberForm';
import toast from 'react-hot-toast';
import './TeamMembers.css';

const TeamMembers = () => {
  const { canManageUsers } = usePermissions();
  const [teamMembers, setTeamMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour le formulaire
  const [showTeamMemberForm, setShowTeamMemberForm] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchTeamMembers(),
      fetchContributions()
    ]);
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
      toast.error('Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const currentDate = new Date();
      const response = await contributionAPI.getTeamContributions({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      });
      if (response.status === 'success') {
        setContributions(response.data.contributions);
      }
    } catch (err) {
      console.error('Erreur contributions:', err);
    }
  };

  const handleCreateTeamMember = () => {
    setEditingTeamMember(null);
    setShowTeamMemberForm(true);
  };

  const handleEditTeamMember = (teamMember) => {
    setEditingTeamMember(teamMember);
    setShowTeamMemberForm(true);
  };

  const handleCloseForm = () => {
    setShowTeamMemberForm(false);
    setEditingTeamMember(null);
  };

  const handleFormSuccess = () => {
    fetchTeamMembers(); // Recharger la liste
  };

  const toggleTeamMemberStatus = async (teamMember) => {
    if (!canManageUsers) {
      toast.error('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    try {
      const newStatus = !teamMember.is_active;
      await memberAPI.updateTeamMember(teamMember.id, { is_active: newStatus });
      
      // Mettre à jour localement
      setTeamMembers(prev => prev.map(tm => 
        tm.id === teamMember.id ? { ...tm, is_active: newStatus } : tm
      ));
      
      toast.success(`Membre ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      console.error('Erreur changement statut:', err);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const getContributionStatus = (memberId) => {
    const contribution = contributions.find(c => c.team_member_id === memberId);
    if (!contribution) return { status: 'none', amount_paid: 0, remaining: 2000 };
    
    const remaining = contribution.amount - (contribution.amount_paid || 0);
    return {
      status: contribution.status,
      amount_paid: contribution.amount_paid || 0,
      remaining: remaining,
      isAdvance: contribution.amount_paid > 0 && contribution.amount_paid < contribution.amount
    };
  };

  const getPositionIcon = (position) => {
    if (position?.toLowerCase().includes('président')) return <Crown size={16} className="position-icon president" />;
    if (position?.toLowerCase().includes('chef') || position?.toLowerCase().includes('directeur')) return <TrendingUp size={16} className="position-icon chief" />;
    return <Users size={16} className="position-icon member" />;
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  if (loading) {
    return (
      <div className="team-members-loading">
        <LoadingSpinner size="large" text="Chargement des membres du bureau..." />
      </div>
    );
  }

  const activeMembers = teamMembers.filter(tm => tm.is_active).length;
  const totalPenalties = teamMembers.reduce((sum, tm) => sum + (tm.penalty_amount || 0), 0);
  const totalContributionsPaid = contributions.reduce((sum, c) => sum + (c.amount_paid || 0), 0);

  return (
    <div className="team-members-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Team Members</h1>
            <p>Gestion des membres du bureau ({teamMembers.length} membres)</p>
          </div>
          {canManageUsers && (
            <button className="btn-primary" onClick={handleCreateTeamMember}>
              <Plus size={20} />
              Nouveau Membre
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
            placeholder="Rechercher un membre..."
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
            <span className="stat-number">{activeMembers}</span>
            <span className="stat-label">Membres actifs</span>
          </div>
        </div>
        <div className="stat-card contributions">
          <DollarSign size={24} />
          <div>
            <span className="stat-number">{formatAmount(totalContributionsPaid)}</span>
            <span className="stat-label">Cotisations collectées</span>
          </div>
        </div>
        <div className="stat-card penalty">
          <AlertCircle size={24} />
          <div>
            <span className="stat-number">{formatAmount(totalPenalties)}</span>
            <span className="stat-label">Pénalités</span>
          </div>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="team-members-grid">
        {filteredTeamMembers.map((member) => {
          const contributionStatus = getContributionStatus(member.id);
          
          return (
            <div key={member.id} className={`team-member-card ${!member.is_active ? 'inactive' : ''}`}>
              <div className="member-avatar">
                <Users size={24} />
              </div>
              
              <div className="member-info">
                <div className="member-header">
                  <h3>{member.name}</h3>
                  {getPositionIcon(member.position)}
                </div>
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

                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>Inscrit le {formatDate(member.registration_date)}</span>
                  </div>

                  {member.penalty_amount > 0 && (
                    <div className="detail-item penalty">
                      <DollarSign size={16} />
                      <span>Pénalités: {formatAmount(member.penalty_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Statut des cotisations */}
                <div className="contribution-status">
                  {contributionStatus.status === 'paye' && (
                    <div className="contribution-badge paid">
                      <UserCheck size={14} />
                      <span>Cotisation payée</span>
                    </div>
                  )}
                  
                  {contributionStatus.isAdvance && (
                    <div className="contribution-badge advance">
                      <TrendingUp size={14} />
                      <span>Avance: {formatAmount(contributionStatus.amount_paid)}</span>
                      <small>Reste: {formatAmount(contributionStatus.remaining)}</small>
                    </div>
                  )}
                  
                  {contributionStatus.status === 'en_attente' && contributionStatus.amount_paid === 0 && (
                    <div className="contribution-badge pending">
                      <AlertCircle size={14} />
                      <span>Cotisation en attente</span>
                    </div>
                  )}
                </div>
                
                <div className="member-meta">
                  <span className={`status ${member.is_active ? 'active' : 'inactive'}`}>
                    {member.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                    {member.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {member.notes && (
                  <div className="member-notes">
                    <p>{member.notes}</p>
                  </div>
                )}
              </div>
              
              {canManageUsers && (
                <div className="member-actions">
                  <div className="actions-dropdown">
                    <button className="action-trigger">
                      <MoreVertical size={16} />
                    </button>
                    <div className="actions-menu">
                      <button onClick={() => handleEditTeamMember(member)}>
                        <Edit size={16} />
                        Modifier
                      </button>
                      <button onClick={() => toggleTeamMemberStatus(member)}>
                        {member.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        {member.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* État vide */}
      {filteredTeamMembers.length === 0 && !loading && (
        <div className="empty-state">
          <Users size={48} />
          <h3>Aucun membre trouvé</h3>
          <p>
            {searchTerm 
              ? 'Aucun membre ne correspond à votre recherche.' 
              : 'Aucun membre du bureau enregistré pour le moment.'
            }
          </p>
          {canManageUsers && !searchTerm && (
            <button className="btn-primary" onClick={handleCreateTeamMember}>
              <Plus size={20} />
              Ajouter le premier membre
            </button>
          )}
        </div>
      )}

      {/* Formulaire de création/édition */}
      <TeamMemberForm
        isOpen={showTeamMemberForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        teamMember={editingTeamMember}
      />
    </div>
  );
};

export default TeamMembers;