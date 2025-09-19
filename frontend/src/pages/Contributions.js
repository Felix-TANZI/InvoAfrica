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
  DollarSign 
} from 'lucide-react';
import { contributionAPI } from '../services/api';
import { usePermissions } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Contributions.css';

const Contributions = () => {
  const { isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('team');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [teamContributions, setTeamContributions] = useState([]);
  const [adherentContributions, setAdherentContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    team: { collected: 0, expected: 0, rate: 0 },
    adherents: { collected: 0, expected: 0, rate: 0 }
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
            rate: parseFloat(response.data.collection_rate)
          }
        }));
      }
    } catch (err) {
      console.error('Erreur team contributions:', err);
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
            rate: parseFloat(response.data.collection_rate)
          }
        }));
      }
    } catch (err) {
      console.error('Erreur adherent contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id, type) => {
    try {
      const paymentData = {
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'cash'
      };

      if (type === 'team') {
        await contributionAPI.markTeamPaid(id, paymentData);
        fetchTeamContributions();
      } else {
        await contributionAPI.markAdherentPaid(id, paymentData);
        fetchAdherentContributions();
      }
    } catch (err) {
      console.error('Erreur marquage paiement:', err);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getStatusInfo = (status, daysLate) => {
    if (status === 'paye') {
      return { label: 'Payé', class: 'status-success', icon: CheckCircle };
    } else if (daysLate > 0) {
      return { label: `En retard (${daysLate}j)`, class: 'status-danger', icon: AlertCircle };
    } else {
      return { label: 'En attente', class: 'status-warning', icon: Clock };
    }
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="contributions-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Cotisations</h1>
            <p>Gestion des cotisations et abonnements</p>
          </div>
          
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
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon team">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Team Members</h3>
            <p className="stat-value">{formatAmount(stats.team.collected)}</p>
            <span className="stat-meta">
              sur {formatAmount(stats.team.expected)} • {stats.team.rate}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon adherents">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <h3>Adhérents</h3>
            <p className="stat-value">{formatAmount(stats.adherents.collected)}</p>
            <span className="stat-meta">
              sur {formatAmount(stats.adherents.expected)} • {stats.adherents.rate}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon total">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Collecté</h3>
            <p className="stat-value">
              {formatAmount(stats.team.collected + stats.adherents.collected)}
            </p>
            <span className="stat-meta">
              Ce mois-ci
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
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
      </div>

      {/* Contributions List */}
      <div className="contributions-list">
        {loading ? (
          <div className="contributions-loading">
            <LoadingSpinner size="large" text="Chargement des cotisations..." />
          </div>
        ) : (
          <div className="contributions-table-container">
            <table className="contributions-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  {activeTab === 'team' && <th>Position</th>}
                  <th>Montant</th>
                  <th>Date Paiement</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'team' ? teamContributions : adherentContributions).map((contribution) => {
                  const statusInfo = getStatusInfo(contribution.status, contribution.days_late || 0);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={contribution.id}>
                      <td className="member-name">
                        {activeTab === 'team' ? contribution.member_name : contribution.adherent_name}
                      </td>
                      {activeTab === 'team' && (
                        <td className="position">{contribution.position || '-'}</td>
                      )}
                      <td className="amount">{formatAmount(contribution.amount)}</td>
                      <td>{formatDate(contribution.payment_date)}</td>
                      <td>
                        <span className={`status-badge ${statusInfo.class}`}>
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {contribution.status === 'en_attente' && (
                          <button 
                            className="pay-button"
                            onClick={() => handleMarkAsPaid(contribution.id, activeTab)}
                          >
                            Marquer payé
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(activeTab === 'team' ? teamContributions : adherentContributions).length === 0 && (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>Aucune cotisation trouvée</h3>
                <p>Aucune cotisation pour {monthNames[currentMonth - 1]} {currentYear}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contributions;