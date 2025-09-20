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
  Calendar,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Activity,
  Sparkles,
  Target,
  Clock,
  CheckCircle2
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
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
    // Vérifier que amount est un nombre valide
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

  const StatCard = ({ title, value, change, icon: Icon, color, delay = 0 }) => (
    <div 
      className={`stat-card ${color}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="stat-card-gradient"></div>
      
      <div className="stat-card-content">
        <div className="stat-header">
          <div className={`stat-icon ${color}`}>
            <Icon size={24} />
          </div>
          {change && (
            <div className="stat-change positive">
              <ArrowUp size={16} />
              {change}%
            </div>
          )}
        </div>
        
        <div className="stat-body">
          <h3 className="stat-title">{title}</h3>
          <p className="stat-value">{value}</p>
        </div>
        
        <div className="stat-decoration"></div>
      </div>
    </div>
  );

  const ChartCard = ({ title, subtitle, children, icon: Icon, className = "" }) => (
    <div className={`chart-container modern ${className}`}>
      <div className="chart-header modern">
        <div className="chart-title-wrapper">
          <div className="chart-icon">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="chart-title">{title}</h3>
            <p className="chart-subtitle">{subtitle}</p>
          </div>
        </div>
        <button className="chart-menu-btn">
          <MoreVertical size={20} />
        </button>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );

  const QuickStat = ({ label, value, icon: Icon, color, trend }) => (
    <div className="quick-stat">
      <div className="quick-stat-left">
        <div className={`quick-stat-icon ${color}`}>
          <Icon size={16} />
        </div>
        <span className="quick-stat-label">{label}</span>
      </div>
      <div className="quick-stat-right">
        <div className="quick-stat-value">{value}</div>
        {trend && (
          <div className={`quick-stat-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

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
    <div className="dashboard modern">
      {/* Header moderne */}
      <div className="dashboard-header modern">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">Tableau de Bord</h1>
            <p className="dashboard-subtitle">
              Bienvenue, {user?.name} • {currentMonth}
            </p>
          </div>
          
          <div className="header-actions">
            <div className="live-indicator">
              <Sparkles size={16} />
              Live
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid modern">
        <StatCard
          title="Solde Global"
          value={formatShortAmount(stats?.global?.solde_global || 0)}
          change="12.5"
          icon={DollarSign}
          color="success"
          delay={0}
        />
        <StatCard
          title="Cotisations du Mois"
          value={formatShortAmount(stats?.mois_courant?.cotisations_collectees || 0)}
          change="8.2"
          icon={TrendingUp}
          color="info"
          delay={100}
        />
        <StatCard
          title="Team Members"
          value={`${stats?.team_members?.membres_payes || 0}/${stats?.team_members?.membres_attendus || 0}`}
          change="5.1"
          icon={Users}
          color="warning"
          delay={200}
        />
        <StatCard
          title="Transactions"
          value={stats?.transactions?.total_mois || 0}
          change="15.3"
          icon={CreditCard}
          color="primary"
          delay={300}
        />
      </div>

      {/* Graphiques */}
      <div className="dashboard-charts modern">
        {/* Évolution des cotisations */}
        <ChartCard
          title="Évolution des Cotisations"
          subtitle="Collecte sur les 6 derniers mois"
          icon={BarChart3}
          className="chart-evolution"
        >
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
        </ChartCard>

        {/* Répartition des fonds */}
        <ChartCard
          title="Répartition des Fonds"
          subtitle="Répartition du mois courant"
          icon={PieChart}
          className="chart-pie"
        >
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
        </ChartCard>

        {/* Comparaison contributions */}
        <ChartCard
          title="Performance des Cotisations"
          subtitle="Comparaison attendu vs collecté"
          icon={BarChart3}
          className="chart-performance"
        >
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
        </ChartCard>
      </div>

      {/* Résumé rapide */}
      <div className="dashboard-summary modern">
        <div className="summary-card modern">
          <div className="summary-header">
            <div className="summary-icon success">
              <Target size={20} />
            </div>
            <h3>Résumé Mensuel</h3>
          </div>
          
          <div className="summary-content">
            <QuickStat
              label="Recettes autres"
              value={formatAmount(stats?.mois_courant?.recettes_autres || 0)}
              icon={TrendingUp}
              color="success"
              trend={12}
            />
            <QuickStat
              label="Dépenses"
              value={formatAmount(stats?.mois_courant?.depenses || 0)}
              icon={Activity}
              color="danger"
              trend={-8}
            />
            <QuickStat
              label="Solde du mois"
              value={formatAmount(stats?.mois_courant?.solde_mois || 0)}
              icon={DollarSign}
              color="info"
              trend={18}
            />
          </div>
        </div>

        <div className="summary-card modern">
          <div className="summary-header">
            <div className="summary-icon primary">
              <CheckCircle2 size={20} />
            </div>
            <h3>Objectifs de Collecte</h3>
          </div>
          
          <div className="summary-content">
            <QuickStat
              label="Team Members"
              value={`${stats?.team_members?.taux_recouvrement || 0}%`}
              icon={Users}
              color="primary"
              trend={5}
            />
            <QuickStat
              label="Adhérents"
              value="92%"
              icon={Clock}
              color="info"
              trend={7}
            />
            <QuickStat
              label="Moyenne générale"
              value={`${stats?.mois_courant?.taux_recouvrement || 0}%`}
              icon={Target}
              color="success"
              trend={6}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;