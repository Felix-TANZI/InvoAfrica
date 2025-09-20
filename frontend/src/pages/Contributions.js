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
  Settings,
  Download,
  Filter
} from 'lucide-react';
import { contributionAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ContributionPaymentForm from '../components/forms/ContributionPaymentForm';
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
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'pending', 'late'
  
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
        setTeamContributions(response.data.contributions);
        setStats(prev => ({
          ...prev,
          team: {
            collected: response.data.stats.total_collected,
            expected: response.data.stats.total_expected,
            rate: parseFloat(response.data.collection_rate),
            paid_count: response.data.stats.paid_count,
            total_count: response.data.stats.total_contributions
          }
        }));
      }
    } catch (err) {
      console.error('Erreur team contributions:', err);
      toast.error('Erreur lors du chargement des cotisations');
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
        setAdherentContributions(response.data.contributions);
        setStats(prev => ({
          ...prev,
          adherents: {
            collected: response.data.stats.total_collected,
            expected: response.data.stats.total_expected,
            rate: parseFloat(response.data.collection_rate),
            paid_count: response.data.stats.paid_count,
            total_count: response.data.stats.total_contributions
          }
        }));
      }
    } catch (err) {
      console.error('Erreur adherent contributions:', err);
      toast.error('Erreur lors du chargement des abonnements');
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
    toast.success('Paiement enregistré avec succès');
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
      toast.error(err.message || 'Erreur lors de la génération');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
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
      const remaining = totalAmount - amountPaid;
      return { 
        label: 'Avance', 
        class: 'status-info', 
        icon: TrendingUp,
        description: `Avance de ${formatAmount(amountPaid)}, reste ${formatAmount(remaining)}`
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
        return contributions.filter(c => c.amount_paid > 0 && c.amount_paid < c.amount);
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

  return (
    <div className="contributions-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Cotisations & Abonnements</h1>
            <p>Gestion des paiements - {monthNames[currentMonth - 1]} {currentYear}</p>
          </div>
          
          <div className="header-actions">
            {isAdmin && (
              <button 
                className="btn-secondary"
                onClick={handleGenerateContributions}
                title="Générer les cotisations du mois"
              >
                <Plus size={20} />
                Générer
              </button>
            )}
            
            <div className="period-selector">
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

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Collecté</h3>
            <p className="stat-value">{formatAmount(currentStats.collected)}</p>
            <span className="stat-meta">
              sur {formatAmount(currentStats.expected)}
            </span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Taux de Recouvrement</h3>
            <p className="stat-value">{currentStats.rate}%</p>
            <span className="stat-meta">
              {currentStats.paid_count}/{currentStats.total_count} payés
            </span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Objectif Mensuel</h3>
            <p className="stat-value">{formatAmount(currentStats.expected)}</p>
            <span className="stat-meta">
              Reste {formatAmount(currentStats.expected - currentStats.collected)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs et Filtres */}
      <div className="controls-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'team' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={20} />
            Team Members
          </button>
          <button 
            className={`tab ${activeTab === 'adherents' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('adherents')}
          >
            <UserPlus size={20} />
            Adhérents
          </button>
        </div>

        <div className="filter-section">
          <Filter size={16} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tous</option>
            <option value="paid">Payés</option>
            <option value="advance">Avances</option>
            <option value="pending">En attente</option>
            <option value="late">En retard</option>
          </select>
        </div>
      </div>

      {/* Liste des contributions */}
      <div className="contributions-section">
        {loading ? (
          <div className="contributions-loading">
            <LoadingSpinner size="large" text="Chargement des cotisations..." />
          </div>
        ) : (
          <div className="contributions-grid">
            {filteredContributions.map((contribution) => {
              const statusInfo = getStatusInfo(
                contribution.status, 
                contribution.days_late || 0,
                contribution.amount_paid || 0,
                contribution.amount
              );
              const StatusIcon = statusInfo.icon;
              const memberName = activeTab === 'team' ? contribution.member_name : contribution.adherent_name;
              
              return (
                <div key={contribution.id} className={`contribution-card ${statusInfo.class}`}>
                  <div className="contribution-header">
                    <div className="member-info">
                      <h3>{memberName}</h3>
                      {activeTab === 'team' && contribution.position && (
                        <span className="position">{contribution.position}</span>
                      )}
                    </div>
                    <div className="status-badge">
                      <StatusIcon size={16} />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="contribution-details">
                    <div className="amount-info">
                      <div className="amount-row">
                        <span>Montant:</span>
                        <strong>{formatAmount(contribution.amount)}</strong>
                      </div>
                      
                      {contribution.amount_paid > 0 && (
                        <div className="amount-row paid">
                          <span>Payé:</span>
                          <strong>{formatAmount(contribution.amount_paid)}</strong>
                        </div>
                      )}
                      
                      {contribution.amount_paid > 0 && contribution.amount_paid < contribution.amount && (
                        <div className="amount-row remaining">
                          <span>Reste:</span>
                          <strong>{formatAmount(contribution.amount - contribution.amount_paid)}</strong>
                        </div>
                      )}
                    </div>

                    {contribution.payment_date && (
                      <div className="payment-info">
                        <Calendar size={14} />
                        <span>Payé le {formatDate(contribution.payment_date)}</span>
                      </div>
                    )}

                    {contribution.notes && (
                      <div className="notes">
                        <p>{contribution.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="contribution-actions">
                    {contribution.status !== 'paye' && (
                      <button 
                        className="btn-pay"
                        onClick={() => handleMarkAsPaid(contribution)}
                      >
                        <CreditCard size={16} />
                        {contribution.amount_paid > 0 ? 'Compléter' : 'Payer'}
                      </button>
                    )}
                    
                    {contribution.status === 'paye' && (
                      <div className="paid-indicator">
                        <CheckCircle size={16} />
                        <span>Complet</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredContributions.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>Aucune cotisation trouvée</h3>
            <p>
              {filter === 'all' 
                ? `Aucune cotisation pour ${monthNames[currentMonth - 1]} ${currentYear}`
                : `Aucune cotisation correspondant au filtre "${filter}"`
              }
            </p>
            {isAdmin && filter === 'all' && (
              <button className="btn-primary" onClick={handleGenerateContributions}>
                <Plus size={20} />
                Générer les cotisations
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de paiement */}
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
    </div>
  );
};

export default Contributions;