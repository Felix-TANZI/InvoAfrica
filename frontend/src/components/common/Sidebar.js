import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  UserPlus, 
  DollarSign,
  Settings,
  X,
  TrendingUp,
  Sparkles,
  ChevronRight,
  BarChart3,
  Target,
  HelpCircle
} from 'lucide-react';
import { usePermissions } from '../../hooks/useAuth';
import { dashboardAPI } from '../../services/api';
import './Sidebar.css';

const Sidebar = ({ mobile = false, onClose, collapsed = false, onToggle }) => {
  const { hasRole } = usePermissions();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const isMountedRef = useRef(true);
  const [sidebarStats, setSidebarStats] = useState({
    objectiveRate: 0,
    totalCollected: 0,
    loading: true
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Récupérer les stats pour la sidebar
  useEffect(() => {
    let isSubscribed = true;

    const fetchSidebarStats = async () => {
      try {
        console.log('🔄 Chargement stats sidebar...');
        
        if (!isSubscribed) return;
        
        setSidebarStats(prev => ({ ...prev, loading: true }));
        
        const response = await dashboardAPI.getStats();
        console.log('📊 Réponse API sidebar:', response);
        
        if (!isSubscribed) return;
        
        if (response.status === 'success') {
          const data = response.data;
          
          // Protection contre les valeurs null/undefined
          const teamExpected = parseFloat(data.team_members?.montant_attendu || 0);
          const teamCollected = parseFloat(data.team_members?.montant_collecte || 0);
          const adherentExpected = parseFloat(data.adherents?.montant_attendu || 0);
          const adherentCollected = parseFloat(data.adherents?.montant_collecte || 0);
          
          // Calcul sécurisé du taux d'objectif global
          const totalExpected = teamExpected + adherentExpected;
          const totalCollected = teamCollected + adherentCollected;
          
          let objectiveRate = 0;
          if (totalExpected > 0 && !isNaN(totalExpected) && !isNaN(totalCollected)) {
            objectiveRate = parseFloat(((totalCollected / totalExpected) * 100).toFixed(1));
          }
          
          console.log('📈 Calculs sidebar:', {
            teamExpected,
            teamCollected,
            adherentExpected, 
            adherentCollected,
            totalExpected,
            totalCollected,
            objectiveRate
          });
          
          if (!isSubscribed) return;
          
          setSidebarStats({
            objectiveRate: objectiveRate || 0,
            totalCollected: totalCollected || 0,
            loading: false
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des stats sidebar:', error);
        if (isSubscribed) {
          setSidebarStats({
            objectiveRate: 0,
            totalCollected: 0,
            loading: false
          });
        }
      }
    };

    // Ne charger que si la sidebar n'est pas réduite
    if (!collapsed) {
      fetchSidebarStats();
      
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(() => {
        if (isSubscribed) {
          fetchSidebarStats();
        }
      }, 30000);
      
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    } else {
      if (isSubscribed) {
        setSidebarStats(prev => ({ ...prev, loading: false }));
      }
    }

    return () => {
      isSubscribed = false;
    };
  }, [collapsed]);

  const formatShortAmount = (amount) => {
    const numAmount = parseFloat(amount);
    
    // Protection contre NaN, null, undefined
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

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble',
      color: 'primary'
    },
    { 
      name: 'Transactions', 
      href: '/transactions', 
      icon: CreditCard,
      description: 'Recettes & Dépenses',
      color: 'success'
    },
    { 
      name: 'Team Members', 
      href: '/team-members', 
      icon: Users, 
      roles: ['admin'],
      description: 'Membres du bureau',
      color: 'info'
    },
    { 
      name: 'Adhérents', 
      href: '/adherents', 
      icon: UserPlus, 
      roles: ['admin'],
      description: 'Membres du club',
      color: 'warning'
    },
    { 
      name: 'Cotisations', 
      href: '/contributions', 
      icon: DollarSign,
      description: 'Paiements & Collectes',
      color: 'accent'
    },
  ];

  const bottomItems = [
    { 
      name: 'Paramètres', 
      href: '/settings', 
      icon: Settings,
      description: 'Configuration',
      color: 'neutral'
    }
  ];

  const handleLinkClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  const isActive = (href) => {
    return location.pathname === href || (href !== '/dashboard' && location.pathname.startsWith(href));
  };

  const NavItem = ({ item, index }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const isHovered = hoveredItem === item.href;

    return (
      <li className={`nav-item ${active ? 'active' : ''}`}>
        <NavLink
          to={item.href}
          className="nav-link modern"
          onClick={handleLinkClick}
          onMouseEnter={() => setHoveredItem(item.href)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`nav-icon ${item.color} ${active ? 'active' : ''}`}>
            <Icon size={collapsed ? 18 : 20} />
          </div>
          
          {!collapsed && (
            <>
              <div className="nav-content">
                <span className="nav-name">{item.name}</span>
                <span className="nav-description">{item.description}</span>
              </div>
              
              {(active || isHovered) && (
                <ChevronRight 
                  size={16} 
                  className={`nav-arrow ${active ? 'active' : ''}`}
                />
              )}
            </>
          )}
          
          {/* Indicateur actif */}
          <div className={`nav-indicator ${active ? 'active' : ''}`}></div>
          
          {/* Effet de hover */}
          <div className="nav-hover-effect"></div>
        </NavLink>

        {/* Tooltip pour sidebar réduite */}
        {collapsed && (
          <div className="nav-tooltip">
            <span>{item.name}</span>
            <small>{item.description}</small>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={`sidebar modern ${collapsed ? 'collapsed' : ''}`}>
      {/* Header sidebar */}
      <div className="sidebar-header modern">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <TrendingUp size={24} />
            <div className="logo-sparkle">
              <Sparkles size={12} />
            </div>
          </div>
          {!collapsed && (
            <div className="logo-text">
              <h2>InvoAfrica</h2>
              <span>Club GI</span>
            </div>
          )}
        </div>
        
        {mobile && (
          <button className="sidebar-close modern" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Stats rapides avec vraies données et protection NaN */}
      {!collapsed && !mobile && (
        <div className="sidebar-stats">
          <div className="stat-item">
            <div className="stat-icon success">
              <Target size={16} />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {sidebarStats.loading ? '...' : `${sidebarStats.objectiveRate}%`}
              </span>
              <span className="stat-label">Objectif atteint</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon info">
              <BarChart3 size={16} />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {sidebarStats.loading ? '...' : formatShortAmount(sidebarStats.totalCollected)}
              </span>
              <span className="stat-label">FCFA collectés</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="sidebar-nav modern">
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Navigation</div>}
          <ul className="nav-list">
            {navigationItems.map((item, index) => {
              // Contrôle d'accès : si l'item a des rôles requis, vérifier les permissions
              if (item.roles && !item.roles.some(role => hasRole(role))) {
                return null;
              }

              return <NavItem key={item.name} item={item} index={index} />;
            })}
          </ul>
        </div>

        {/* Section Help & Support */}
        {!collapsed && (
          <div className="nav-section">
            <div className="nav-section-title">Support</div>
            <ul className="nav-list">
              <li className="nav-item">
                <button className="nav-link modern help-link">
                  <div className="nav-icon neutral">
                    <HelpCircle size={20} />
                  </div>
                  <div className="nav-content">
                    <span className="nav-name">Aide</span>
                    <span className="nav-description">Documentation</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Navigation du bas */}
      <div className="sidebar-bottom">
        <ul className="nav-list">
          {bottomItems.map((item, index) => (
            <NavItem key={item.name} item={item} index={index} />
          ))}
        </ul>

        {/* Status indicator */}
        {!collapsed && (
          <div className="sidebar-status">
            <div className="status-indicator online">
              <div className="status-dot"></div>
              <span>Système opérationnel</span>
            </div>
          </div>
        )}
      </div>

      {/* Effet de background animé */}
      <div className="sidebar-bg-effect">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
      </div>
    </div>
  );
};

export default Sidebar;