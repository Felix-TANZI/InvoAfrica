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
  AlertCircle,
  Target,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { memberAPI, contributionAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TeamMemberForm from '../components/forms/TeamMemberForm';
import PdfExportButton from '../components/pdf/PdfExportButton';
import toast from 'react-hot-toast';
import './TeamMembers.css';

const TeamMembers = () => {
  const { canManageUsers } = usePermissions();
  const [teamMembers, setTeamMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
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
    if (position?.toLowerCase().includes('président')) {
      return <Crown size={16} className="position-icon modern president" />;
    }
    if (position?.toLowerCase().includes('chef') || position?.toLowerCase().includes('directeur')) {
      return <TrendingUp size={16} className="position-icon modern chief" />;
    }
    return <Users size={16} className="position-icon modern member" />;
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="team-members-loading modern">
        <LoadingSpinner size="large" text="Chargement des membres du bureau..." />
      </div>
    );
  }

  const activeMembers = teamMembers.filter(tm => tm.is_active).length;
  const totalPenalties = teamMembers.reduce((sum, tm) => sum + (tm.penalty_amount || 0), 0);
  const totalContributionsPaid = contributions.reduce((sum, c) => sum + (c.amount_paid || 0), 0);

  return (
    <div className="team-members-page modern">
      {/* Header moderne */}
      <div className="page-header modern">
        <div className="header-content modern">
          <div className="header-text">
            <h1 className="page-title">Team Members</h1>
            <p className="page-subtitle">
              Gestion des membres du bureau
              <span className="member-count-badge">
                <Sparkles size={12} />
                {teamMembers.length} membres
              </span>
            </p>
          </div>
          
          {canManageUsers && (
            <button className="btn-primary modern" onClick={handleCreateTeamMember}>
              <Plus size={20} />
              Nouveau Membre
            </button>
          )}

          {/* ✅ NOUVEAU : Bouton PDF */}
    <PdfExportButton 
      variant="team-members"
      filters={{ 
        status: 'active', // ou selon vos filtres
        contribution_status: 'paid' // optionnel
      }}
    />
        </div>
      </div>

      {/* Barre de recherche moderne */}
      <div className="search-section modern">
        <div className="search-container modern">
          <div className={`search-input modern ${searchFocused ? 'focused' : ''}`}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
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
              <span className="stat-number modern">{activeMembers}</span>
              <span className="stat-label modern">Membres actifs</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card modern contributions">
          <div className="stat-card-content">
            <div className="stat-icon modern contributions">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-number modern">{formatShortAmount(totalContributionsPaid)}</span>
              <span className="stat-label modern">Cotisations collectées</span>
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
              <span className="stat-label modern">Pénalités</span>
            </div>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      {/* Liste des membres moderne */}
      <div className="team-members-grid modern">
        {filteredTeamMembers.map((member, index) => {
          const contributionStatus = getContributionStatus(member.id);
          
          return (
            <div 
              key={member.id} 
              className={`team-member-card modern ${!member.is_active ? 'inactive' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="member-avatar modern">
                <Users size={24} />
              </div>
              
              <div className="member-info">
                <div className="member-header modern">
                  <h3>{member.name}</h3>
                  {getPositionIcon(member.position)}
                </div>
                
                <p className="position modern">
                  {member.position || 'Membre'}
                </p>
                
                <div className="member-details modern">
                  {member.email && (
                    <div className="detail-item modern">
                      <Mail size={16} />
                      <span>{member.email}</span>
                    </div>
                  )}
                  
                  {member.phone && (
                    <div className="detail-item modern">
                      <Phone size={16} />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  <div className="detail-item modern">
                    <Calendar size={16} />
                    <span>Inscrit le {formatDate(member.registration_date)}</span>
                  </div>

                  {member.penalty_amount > 0 && (
                    <div className="detail-item modern penalty">
                      <DollarSign size={16} />
                      <span>Pénalités: {formatAmount(member.penalty_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Statut des cotisations moderne */}
                <div className="contribution-status modern">
                  {contributionStatus.status === 'paye' && (
                    <div className="contribution-badge modern paid">
                      <CheckCircle2 size={14} />
                      <span>Cotisation payée</span>
                    </div>
                  )}
                  
                  {contributionStatus.isAdvance && (
                    <div className="contribution-badge modern advance">
                      <Target size={14} />
                      <span>Avance: {formatAmount(contributionStatus.amount_paid)}</span>
                      <small>Reste: {formatAmount(contributionStatus.remaining)}</small>
                    </div>
                  )}
                  
                  {contributionStatus.status === 'en_attente' && contributionStatus.amount_paid === 0 && (
                    <div className="contribution-badge modern pending">
                      <Clock size={14} />
                      <span>Cotisation en attente</span>
                    </div>
                  )}
                </div>
                
                <div className="member-meta modern">
                  <span className={`status modern ${member.is_active ? 'active' : 'inactive'}`}>
                    {member.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                    {member.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {member.notes && (
                  <div className="member-notes modern">
                    <p>{member.notes}</p>
                  </div>
                )}
              </div>
              
              {canManageUsers && (
                <div className="member-actions modern">
                  <div className="actions-dropdown modern">
                    <button className="action-trigger modern">
                      <MoreVertical size={16} />
                    </button>
                    <div className="actions-menu modern">
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

      {/* État vide moderne */}
      {filteredTeamMembers.length === 0 && !loading && (
        <div className="empty-state modern">
          <Users size={64} />
          <h3>Aucun membre trouvé</h3>
          <p>
            {searchTerm 
              ? 'Aucun membre ne correspond à votre recherche. Essayez avec d\'autres mots-clés.' 
              : 'Aucun membre du bureau enregistré pour le moment. Commencez par ajouter votre premier membre.'
            }
          </p>
          {canManageUsers && !searchTerm && (
            <button className="btn-primary modern" onClick={handleCreateTeamMember}>
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