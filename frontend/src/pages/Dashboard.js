/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard,
  AlertCircle 
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { selectCurrentUser } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.status === 'success') {
        setStats(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" text="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={48} />
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardStats} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <p>Bienvenue, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Solde Global</h3>
            <p className="stat-value">{formatAmount(stats?.global?.solde_global || 0)}</p>
            <span className="stat-change positive">
              Trésorerie actuelle
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Cotisations du Mois</h3>
            <p className="stat-value">{formatAmount(stats?.mois_courant?.cotisations_collectees || 0)}</p>
            <span className="stat-change">
              Taux: {stats?.mois_courant?.taux_recouvrement || 0}%
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Team Members</h3>
            <p className="stat-value">{stats?.team_members?.membres_payes || 0}/{stats?.team_members?.membres_attendus || 0}</p>
            <span className="stat-change">
              Payés ce mois
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon primary">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p className="stat-value">{stats?.transactions?.total_mois || 0}</p>
            <span className="stat-change">
              Ce mois
            </span>
          </div>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Résumé Mensuel</h3>
          <div className="summary-item">
            <span>Recettes autres</span>
            <span>{formatAmount(stats?.mois_courant?.recettes_autres || 0)}</span>
          </div>
          <div className="summary-item">
            <span>Dépenses</span>
            <span>{formatAmount(stats?.mois_courant?.depenses || 0)}</span>
          </div>
          <div className="summary-item total">
            <span>Solde du mois</span>
            <span>{formatAmount(stats?.mois_courant?.solde_mois || 0)}</span>
          </div>
        </div>

        <div className="summary-card">
          <h3>Adhérents</h3>
          <div className="summary-item">
            <span>Abonnements payés</span>
            <span>{stats?.adherents?.adherents_payes || 0}/{stats?.adherents?.adherents_attendus || 0}</span>
          </div>
          <div className="summary-item">
            <span>Montant collecté</span>
            <span>{formatAmount(stats?.adherents?.montant_collecte || 0)}</span>
          </div>
          <div className="summary-item">
            <span>Taux de recouvrement</span>
            <span>{stats?.adherents?.taux_recouvrement || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;