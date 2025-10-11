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
  UserPlus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  Plus,
  CreditCard,
  TrendingUp,
  Filter,
  Sparkles,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { contributionAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ContributionPaymentForm from '../components/forms/ContributionPaymentForm';
import { PdfExportDropdown } from '../components/pdf/PdfExportButton';
import toast from 'react-hot-toast';
import './Contributions.css';

const Contributions = () => {
  const { isAdmin, canManageUsers } = usePermissions();
  const [activeTab, setActiveTab] = useState('team');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [teamContributions, setTeamContributions] = useState([]);
  const [adherentContributions, setAdherentContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Modal de paiement
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);
  
  const [stats, setStats] = useState({
    team: { collected: 0, expected: 0, rate: 0, paid_count: 0, total_count: 0 },
    adherents: { collected: 0, expected: 0, rate: 0, paid_count: 0, total_count: 0 }
  });

  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeamContributions();
    } else {
      fetchAdherentContributions();
    }
  }, [activeTab, currentMonth, currentYear]);

  const fetchTeamContributions = async () => {
    try {
      setLoading(true);
      const response = await contributionAPI.getTeamContributions({
        year: currentYear,
        month: currentMonth
      });
      
      if (response.status === 'success') {
        setTeamContributions(response.data.contributions || []);
        setStats(prev => ({
          ...prev,
          team: {
            collected: response.data.stats?.total_collected || 0,
            expected: response.data.stats?.total_expected || 0,
            rate: parseFloat(response.data.collection_rate || 0),
            paid_count: response.data.stats?.paid_count || 0,
            total_count: response.data.stats?.total_contributions || 0
          }
        }));
      }
    } catch (err) {
      console.error('Erreur team contributions:', err);
      toast.error('Erreur lors du chargement des cotisations');
      setTeamContributions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdherentContributions = async () => {
    try {
      setLoading(true);
      const response = await contributionAPI.getAdherentContributions({
        year: currentYear,
        month: currentMonth
      });
      
      if (response.status === 'success') {
        setAdherentContributions(response.data.contributions || []);
        setStats(prev => ({
          ...prev,
          adherents: {
            collected: response.data.stats?.total_collected || 0,
            expected: response.data.stats?.total_expected || 0,
            rate: parseFloat(response.data.collection_rate || 0),
            paid_count: response.data.stats?.paid_count || 0,
            total_count: response.data.stats?.total_contributions || 0
          }
        }));
      }
    } catch (err) {
      console.error('Erreur adherent contributions:', err);
      toast.error('Erreur lors du chargement des abonnements');
      setAdherentContributions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = (contribution) => {
    setSelectedContribution(contribution);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    if (activeTab === 'team') {
      fetchTeamContributions();
    } else {
      fetchAdherentContributions();
    }
    setShowPaymentForm(false);
    setSelectedContribution(null);
  };

  const handleGenerateContributions = async () => {
    try {
      if (activeTab === 'team') {
        await contributionAPI.generateTeam({ month: currentMonth, year: currentYear });
        toast.success('Cotisations team générées avec succès');
        fetchTeamContributions();
      } else {
        await contributionAPI.generateAdherents({ month: currentMonth, year: currentYear });
        toast.success('Abonnements adhérents générés avec succès');
        fetchAdherentContributions();
      }
    } catch (err) {
      console.error('Erreur génération:', err);
      toast.error(err.message || 'Erreur lors de la génération');
    }
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status, daysLate, amountPaid, totalAmount) => {
    if (status === 'paye') {
      return { 
        label: 'Payé', 
        class: 'status-success', 
        icon: CheckCircle,
        description: 'Cotisation complète payée'
      };
    } else if (amountPaid > 0 && amountPaid < totalAmount) {
      return { 
        label: 'Avance', 
        class: 'status-info', 
        icon: TrendingUp,
        description: `Avance de ${formatAmount(amountPaid)}`
      };
    } else if (daysLate > 0) {
      return { 
        label: `Retard ${daysLate}j`, 
        class: 'status-danger', 
        icon: AlertCircle,
        description: `En retard de ${daysLate} jour(s)`
      };
    } else {
      return { 
        label: 'En attente', 
        class: 'status-warning', 
        icon: Clock,
        description: 'Paiement en attente'
      };
    }
  };

  const getFilteredContributions = () => {
    const contributions = activeTab === 'team' ? teamContributions : adherentContributions;
    
    switch (filter) {
      case 'paid':
        return contributions.filter(c => c.status === 'paye');
      case 'pending':
        return contributions.filter(c => c.status === 'en_attente' && (c.days_late || 0) <= 0);
      case 'late':
        return contributions.filter(c => c.status === 'en_attente' && (c.days_late || 0) > 0);
      case 'advance':
        return contributions.filter(c => (c.amount_paid || 0) > 0 && (c.amount_paid || 0) < (c.amount || 0));
      default:
        return contributions;
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentStats = activeTab === 'team' ? stats.team : stats.adherents;
  const filteredContributions = getFilteredContributions();

  if (loading) {
    return (
      <div className="contributions-loading modern">
        <LoadingSpinner size="large" text="Chargement des cotisations..." />
      </div>
    );
  }

  return (
    <div className="contributions-page modern">
      {/* Header moderne */}
      <div className="page-header modern">
        <div className="header-content modern">
          <div className="header-info">
            <h1>Cotisations & Abonnements</h1>
            <p>
              Gestion des paiements
              <span className="period-badge">
                <Sparkles size={12} />
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
            </p>
          </div>
          
          <div className="header-actions modern">
            {isAdmin && (
              <button 
                className="btn-secondary modern"
                onClick={handleGenerateContributions}
                title="Générer les cotisations du mois"
              >
                <Plus size={20} />
                Générer
              </button>
            )}

            {/* ✅ NOUVEAU : Bouton PDF avec dropdown (Tous/Payés/Non payés) */}
    <PdfExportDropdown 
      variant={activeTab === 'team' ? 'team-contributions' : 'adherent-contributions'}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
            
            <div className="period-selector modern">
              <select 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <select 
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards modernes */}
      <div className="stats-grid modern">
        <div className="stat-card modern primary">
          <div className="stat-icon modern">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Collecté</h3>
            <p className="stat-value">{formatShortAmount(currentStats.collected)}</p>
            <span className="stat-meta">
              sur {formatShortAmount(currentStats.expected)} attendu
            </span>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card modern success">
          <div className="stat-icon modern">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>Taux de Recouvrement</h3>
            <p className="stat-value">{currentStats.rate.toFixed(1)}%</p>
            <span className="stat-meta">
              {currentStats.paid_count}/{currentStats.total_count} payés
            </span>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="stat-card modern info">
          <div className="stat-icon modern">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>Objectif Mensuel</h3>
            <p className="stat-value">{formatShortAmount(currentStats.expected)}</p>
            <span className="stat-meta">
              Reste {formatShortAmount(Math.max(0, currentStats.expected - currentStats.collected))}
            </span>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      {/* Tabs et Filtres modernes */}
      <div className="controls-section modern">
        <div className="tabs modern">
          <button 
            className={`tab modern ${activeTab === 'team' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={20} />
            Team Members
          </button>
          <button 
            className={`tab modern ${activeTab === 'adherents' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('adherents')}
          >
            <UserPlus size={20} />
            Adhérents
          </button>
        </div>

        <div className="filter-section modern">
          <Filter size={16} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tous ({filteredContributions.length})</option>
            <option value="paid">Payés</option>
            <option value="advance">Avances</option>
            <option value="pending">En attente</option>
            <option value="late">En retard</option>
          </select>
        </div>
      </div>

      {/* Liste des contributions moderne */}
      <div className="contributions-section">
        {filteredContributions.length > 0 ? (
          <div className="contributions-grid modern">
            {filteredContributions.map((contribution, index) => {
              const statusInfo = getStatusInfo(
                contribution.status, 
                contribution.days_late || 0,
                contribution.amount_paid || 0,
                contribution.amount || 0
              );
              const StatusIcon = statusInfo.icon;
              const memberName = activeTab === 'team' ? contribution.member_name : contribution.adherent_name;
              
              return (
                <div 
                  key={contribution.id} 
                  className={`contribution-card modern ${statusInfo.class}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="contribution-header modern">
                    <div className="member-info">
                      <h3>{memberName || 'Nom non disponible'}</h3>
                      {activeTab === 'team' && contribution.position && (
                        <span className="position">
                          <Award size={14} />
                          {contribution.position}
                        </span>
                      )}
                    </div>
                    <div className="status-badge modern">
                      <StatusIcon size={16} />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="contribution-details modern">
                    <div className="amount-info modern">
                      <div className="amount-row">
                        <span>Montant:</span>
                        <strong>{formatAmount(contribution.amount || 0)}</strong>
                      </div>
                      
                      {(contribution.amount_paid || 0) > 0 && (
                        <div className="amount-row paid">
                          <span>Payé:</span>
                          <strong>{formatAmount(contribution.amount_paid)}</strong>
                        </div>
                      )}
                      
                      {(contribution.amount_paid || 0) > 0 && (contribution.amount_paid || 0) < (contribution.amount || 0) && (
                        <div className="amount-row remaining">
                          <span>Reste:</span>
                          <strong>{formatAmount((contribution.amount || 0) - (contribution.amount_paid || 0))}</strong>
                        </div>
                      )}
                    </div>

                    {contribution.payment_date && (
                      <div className="payment-info modern">
                        <Calendar size={14} />
                        <span>Payé le {formatDate(contribution.payment_date)}</span>
                      </div>
                    )}

                    {contribution.notes && (
                      <div className="notes modern">
                        <p>{contribution.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="contribution-actions modern">
                    {contribution.status !== 'paye' && canManageUsers && (
                      <button 
                        className="btn-pay modern"
                        onClick={() => handleMarkAsPaid(contribution)}
                      >
                        <CreditCard size={16} />
                        {(contribution.amount_paid || 0) > 0 ? 'Compléter' : 'Payer'}
                      </button>
                    )}
                    
                    {contribution.status === 'paye' && (
                      <div className="paid-indicator modern">
                        <CheckCircle size={16} />
                        <span>Complet</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state modern">
            <Calendar size={64} />
            <h3>Aucune cotisation trouvée</h3>
            <p>
              {filter === 'all' 
                ? `Aucune cotisation pour ${monthNames[currentMonth - 1]} ${currentYear}`
                : `Aucune cotisation correspondant au filtre "${filter}"`
              }
            </p>
            {isAdmin && filter === 'all' && (
              <button className="btn-primary modern" onClick={handleGenerateContributions}>
                <Plus size={20} />
                Générer les cotisations
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {showPaymentForm && selectedContribution && (
        <ContributionPaymentForm
          isOpen={showPaymentForm}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedContribution(null);
          }}
          onSuccess={handlePaymentSuccess}
          contribution={selectedContribution}
          type={activeTab}
        />
      )}
    </div>
  );
};

export default Contributions;