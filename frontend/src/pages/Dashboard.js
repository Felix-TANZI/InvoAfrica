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
  AlertCircle,
  PieChart,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { dashboardAPI } from '../services/api';
import { selectCurrentUser } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    evolution: [],
    categories: [],
    contributions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.status === 'success') {
        setStats(response.data);
        prepareChartData(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (data) => {
    // Données d'évolution (6 derniers mois)
    const evolutionData = data.evolution_6_mois?.map(item => ({
      month: `${item.month}/${item.year}`,
      team_collected: item.team_collected || 0,
      adherent_collected: item.adherent_collected || 0,
      total: (item.team_collected || 0) + (item.adherent_collected || 0)
    })) || [];

    // Données pour graphique en secteurs des catégories
    const categoriesData = [
      { name: 'Team Members', value: data.team_members?.montant_collecte || 0, color: '#3b82f6' },
      { name: 'Adhérents', value: data.adherents?.montant_collecte || 0, color: '#10b981' },
      { name: 'Autres Recettes', value: data.mois_courant?.recettes_autres || 0, color: '#f59e0b' },
      { name: 'Dépenses', value: data.mois_courant?.depenses || 0, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Données de comparaison contributions
    const contributionsData = [
      {
        category: 'Team Members',
        attendu: data.team_members?.montant_attendu || 0,
        collecte: data.team_members?.montant_collecte || 0,
        taux: parseFloat(data.team_members?.taux_recouvrement || 0)
      },
      {
        category: 'Adhérents',
        attendu: data.adherents?.montant_attendu || 0,
        collecte: data.adherents?.montant_collecte || 0,
        taux: parseFloat(data.adherents?.taux_recouvrement || 0)
      }
    ];

    setChartData({
      evolution: evolutionData,
      categories: categoriesData,
      contributions: contributionsData
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatShortAmount = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toString();
  };

  // Composant Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <button onClick={fetchDashboardData} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <p>Bienvenue, {user?.name} • {currentMonth}</p>
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
              {stats?.team_members?.taux_recouvrement || 0}% collecté
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
              {stats?.transactions?.en_attente || 0} en attente
            </span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="dashboard-charts">
        {/* Évolution des cotisations */}
        <div className="chart-container">
          <div className="chart-header">
            <h3><BarChart3 size={20} /> Évolution des Cotisations</h3>
            <p>Collecte sur les 6 derniers mois</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.evolution}>
                <defs>
                  <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="adherentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatShortAmount} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="team_collected"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="url(#teamGradient)"
                  name="Team Members"
                />
                <Area
                  type="monotone"
                  dataKey="adherent_collected"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#adherentGradient)"
                  name="Adhérents"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition des fonds */}
        <div className="chart-container">
          <div className="chart-header">
            <h3><PieChart size={20} /> Répartition des Fonds</h3>
            <p>Répartition du mois courant</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={formatAmount} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparaison contributions */}
        <div className="chart-container full-width">
          <div className="chart-header">
            <h3><BarChart3 size={20} /> Performance des Cotisations</h3>
            <p>Comparaison attendu vs collecté</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.contributions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={formatShortAmount} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="attendu" fill="#e5e7eb" name="Attendu" />
                <Bar dataKey="collecte" fill="#3b82f6" name="Collecté" />
              </BarChart>
            </ResponsiveContainer>
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
          <h3>Objectifs de Collecte</h3>
          <div className="summary-item">
            <span>Team Members</span>
            <span>{stats?.team_members?.taux_recouvrement || 0}%</span>
          </div>
          <div className="summary-item">
            <span>Adhérents</span>
            <span>{stats?.adherents?.taux_recouvrement || 0}%</span>
          </div>
          <div className="summary-item total">
            <span>Moyenne générale</span>
            <span>{stats?.mois_courant?.taux_recouvrement || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;