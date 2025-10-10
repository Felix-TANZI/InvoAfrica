/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - AVEC PDF INTÉGRÉ

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
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Activity,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Download,
  ChevronRight
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
import { pdfAPI } from '../services/api';
import { selectCurrentUser } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
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
  
  // État pour les rapports PDF
  const [loadingReport, setLoadingReport] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      console.log('📊 API Response Dashboard:', JSON.stringify(response, null, 2));
      
      if (response.status === 'success') {
        const cleanedData = cleanAPIData(response.data);
        setStats(cleanedData);
        prepareChartData(cleanedData);
      }
    } catch (err) {
      console.error('❌ Erreur dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cleanAPIData = (data) => {
    console.log('🧹 Nettoyage des données API...');
    
    const teamCollected = parseFloat(data.team_members?.montant_collecte || 0);
    const adherentCollected = parseFloat(data.adherents?.montant_collecte || 0);
    const teamExpected = parseFloat(data.team_members?.montant_attendu || 0);
    const adherentExpected = parseFloat(data.adherents?.montant_attendu || 0);
    
    const totalCollected = teamCollected + adherentCollected;
    const totalExpected = teamExpected + adherentExpected;
    const globalRate = totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0;
    
    console.log('✅ Valeurs corrigées:', {
      teamCollected,
      adherentCollected,
      totalCollected,
      totalExpected,
      globalRate
    });

    return {
      ...data,
      mois_courant: {
        ...data.mois_courant,
        cotisations_collectees: totalCollected,
        cotisations_attendues: totalExpected,
        taux_recouvrement: parseFloat(globalRate),
        recettes_autres: 0
      }
    };
  };

  const prepareChartData = (data) => {
    const evolutionData = data.evolution_6_mois?.map(item => ({
      month: `${item.month}/${item.year}`,
      team_collected: parseFloat(item.team_collected) || 0,
      adherent_collected: parseFloat(item.adherent_collected) || 0,
      total: (parseFloat(item.team_collected) || 0) + (parseFloat(item.adherent_collected) || 0)
    })) || [];

    const categoriesData = [
      { name: 'Team Members', value: parseFloat(data.team_members?.montant_collecte) || 0, color: '#3b82f6' },
      { name: 'Adhérents', value: parseFloat(data.adherents?.montant_collecte) || 0, color: '#10b981' },
      { name: 'Autres Recettes', value: data.mois_courant?.recettes_autres || 0, color: '#f59e0b' },
      { name: 'Dépenses', value: parseFloat(data.mois_courant?.depenses) || 0, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const contributionsData = [
      {
        category: 'Team Members',
        attendu: parseFloat(data.team_members?.montant_attendu) || 0,
        collecte: parseFloat(data.team_members?.montant_collecte) || 0,
        taux: parseFloat(data.team_members?.taux_recouvrement) || 0
      },
      {
        category: 'Adhérents',
        attendu: parseFloat(data.adherents?.montant_attendu) || 0,
        collecte: parseFloat(data.adherents?.montant_collecte) || 0,
        taux: parseFloat(data.adherents?.taux_recouvrement) || 0
      }
    ];

    setChartData({
      evolution: evolutionData,
      categories: categoriesData,
      contributions: contributionsData
    });
  };

  const calculateFirstMonthTrends = () => {
    if (!stats) return { solde: 0, cotisations: 0, transactions: 0, teamMembers: 0 };
    
    const teamRate = parseFloat(stats.team_members?.taux_recouvrement || 0);
    const adherentRate = parseFloat(stats.adherents?.taux_recouvrement || 0);
    const globalRate = parseFloat(stats.mois_courant?.taux_recouvrement || 0);
    const soldeGlobal = stats.global?.solde_global || 0;
    
    console.log('📈 Calcul des tendances:', { teamRate, adherentRate, globalRate, soldeGlobal });
    
    return {
      solde: soldeGlobal > 0 ? Math.min((soldeGlobal / 1000), 20) : 0,
      cotisations: globalRate > 50 ? 
        Math.min((globalRate - 50) * 0.5, 15) : 
        globalRate > 20 ? 
          Math.min((globalRate - 20) * 0.3, 8) : 
          globalRate > 0 ? 
            -(30 - globalRate) * 0.2 : 
            -10,
      transactions: stats.transactions?.total_mois > 10 ? 
        Math.min((stats.transactions.total_mois - 10) * 1.2, 25) : 0,
      teamMembers: teamRate > 50 ? 
        Math.min((teamRate - 50) * 0.4, 12) :
        teamRate > 20 ? 
          Math.min((teamRate - 20) * 0.2, 6) :
          teamRate > 0 ? 
            -(30 - teamRate) * 0.15 :
            -8
    };
  };

  const getTrendFromEvolution = () => {
    return calculateFirstMonthTrends();
  };

  const calculateGlobalObjectiveRate = () => {
    if (!stats) return 0;
    
    const totalExpected = parseFloat(stats.team_members?.montant_attendu || 0) + parseFloat(stats.adherents?.montant_attendu || 0);
    const totalCollected = parseFloat(stats.team_members?.montant_collecte || 0) + parseFloat(stats.adherents?.montant_collecte || 0);
    
    if (totalExpected === 0 || isNaN(totalExpected) || isNaN(totalCollected)) return 0;
    return parseFloat(((totalCollected / totalExpected) * 100).toFixed(1));
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

  const formatFullAmount = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(numAmount));
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

  // ✨ NOUVEAU - Fonctions pour les rapports PDF
  const handleDownloadReport = async (reportType) => {
    setLoadingReport(reportType);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    try {
      if (reportType === 'current-month') {
        await pdfAPI.downloadFinancialReport({ 
          year: currentYear, 
          month: currentMonth 
        });
        toast.success('Rapport mensuel téléchargé !');
      } else if (reportType === 'last-month') {
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const year = currentMonth === 1 ? currentYear - 1 : currentYear;
        await pdfAPI.downloadFinancialReport({ 
          year, 
          month: lastMonth 
        });
        toast.success('Rapport du mois dernier téléchargé !');
      } else if (reportType === 'current-year') {
        await pdfAPI.downloadFinancialReport({ 
          year: currentYear 
        });
        toast.success('Rapport annuel téléchargé !');
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
      console.error('Erreur rapport:', error);
    } finally {
      setLoadingReport(null);
    }
  };

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

  const StatCard = ({ title, value, change, icon: Icon, color, delay = 0 }) => {
    const trendValue = parseFloat(change) || 0;
    const showTrend = Math.abs(trendValue) >= 0.1;
    
    return (
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
            {showTrend && (
              <div className={`stat-change ${trendValue >= 0 ? 'positive' : 'negative'}`} style={{
                color: trendValue >= 0 ? '#059669' : '#dc2626',
                backgroundColor: trendValue >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
              }}>
                {trendValue >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(trendValue).toFixed(1)}%
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
  };

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

  const QuickStat = ({ label, value, icon: Icon, color, trend }) => {
    const trendValue = parseFloat(trend) || 0;
    const showTrend = Math.abs(trendValue) >= 0.1;
    
    return (
      <div className="quick-stat">
        <div className="quick-stat-left">
          <div className={`quick-stat-icon ${color}`}>
            <Icon size={16} />
          </div>
          <span className="quick-stat-label">{label}</span>
        </div>
        <div className="quick-stat-right">
          <div className="quick-stat-value">{value}</div>
          {showTrend && (
            <div className={`quick-stat-trend ${trendValue > 0 ? 'positive' : 'negative'}`}>
              {trendValue > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(trendValue).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✨ NOUVEAU - Composant Section Rapports PDF (intégré directement)
  const ReportsSection = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const quickReports = [
      {
        id: 'current-month',
        title: 'Rapport du mois en cours',
        description: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        icon: Calendar,
        color: '#FF8C00'
      },
      {
        id: 'last-month',
        title: 'Rapport du mois dernier',
        description: new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        icon: Calendar,
        color: '#3b82f6'
      },
      {
        id: 'current-year',
        title: 'Rapport annuel',
        description: `Année ${currentYear}`,
        icon: TrendingUp,
        color: '#10b981'
      }
    ];

    return (
      <div className="reports-section" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '24px'
      }}>
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <FileText size={24} style={{ color: '#FF8C00' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
                Rapports Financiers
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Générez et téléchargez vos rapports en PDF
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {quickReports.map(report => {
            const Icon = report.icon;
            const isLoading = loadingReport === report.id;
            
            return (
              <button
                key={report.id}
                onClick={() => handleDownloadReport(report.id)}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = report.color;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${report.color}15`,
                  flexShrink: 0
                }}>
                  <Icon size={24} style={{ color: report.color }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                    {report.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    {report.description}
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  flexShrink: 0
                }}>
                  {isLoading ? (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #e5e7eb',
                      borderTopColor: report.color,
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{
          display: 'flex',
          gap: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6b7280' }}>
            <Download size={16} style={{ color: '#FF8C00' }} />
            <span>Les rapports sont générés au format PDF professionnel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#6b7280' }}>
            <FileText size={16} style={{ color: '#FF8C00' }} />
            <span>Incluent statistiques, graphiques et signature officielle</span>
          </div>
        </div>
      </div>
    );
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
  const trends = getTrendFromEvolution();
  const globalObjectiveRate = calculateGlobalObjectiveRate();

  console.log('📊 Trends calculées:', trends);
  console.log('🎯 Taux objectif global:', globalObjectiveRate);

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
          value={formatFullAmount(stats?.global?.solde_global || 0) + ' FCFA'}
          change={trends.solde}
          icon={DollarSign}
          color="success"
          delay={0}
        />
        <StatCard
          title="Cotisations du Mois"
          value={formatFullAmount(stats?.mois_courant?.cotisations_collectees || 0) + ' FCFA'}
          change={trends.cotisations}
          icon={TrendingUp}
          color="info"
          delay={100}
        />
        <StatCard
          title="Team Members"
          value={`${stats?.team_members?.membres_payes || 0}/${stats?.team_members?.membres_attendus || 0}`}
          change={trends.teamMembers}
          icon={Users}
          color="warning"
          delay={200}
        />
        <StatCard
          title="Transactions"
          value={stats?.transactions?.total_mois || 0}
          change={trends.transactions}
          icon={CreditCard}
          color="primary"
          delay={300}
        />
      </div>

      {/* ✨ NOUVEAU - Section Rapports PDF */}
      <ReportsSection />

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
              trend={0}
            />
            <QuickStat
              label="Dépenses"
              value={formatAmount(stats?.mois_courant?.depenses || 0)}
              icon={Activity}
              color="danger"
              trend={0}
            />
            <QuickStat
              label="Solde du mois"
              value={formatAmount(stats?.mois_courant?.solde_mois || 0)}
              icon={DollarSign}
              color="info"
              trend={trends.solde}
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
              trend={trends.teamMembers}
            />
            <QuickStat
              label="Adhérents"
              value={`${stats?.adherents?.taux_recouvrement || 0}%`}
              icon={Clock}
              color="info"
              trend={parseFloat(stats?.adherents?.taux_recouvrement || 0) > 10 ? 2 : -3}
            />
            <QuickStat
              label="Objectif Global"
              value={`${globalObjectiveRate}%`}
              icon={Target}
              color="success"
              trend={globalObjectiveRate > 30 ? 5 : globalObjectiveRate > 15 ? 1 : -5}
            />
          </div>
        </div>
      </div>

      {/* Style pour l'animation de spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;