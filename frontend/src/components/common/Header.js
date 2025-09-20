/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Search,
  Settings,
  ChevronDown,
  Sidebar,
  Sun,
  Moon,
  Maximize,
  MoreHorizontal
} from 'lucide-react';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const Header = ({ onMobileMenuToggle, onSidebarToggle, sidebarCollapsed }) => {
  const user = useSelector(selectCurrentUser);
  const { logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const notifications = [
    {
      id: 1,
      title: "Nouvelle cotisation",
      message: "Jean Dupont a payé sa cotisation",
      time: "Il y a 5 min",
      type: "success",
      unread: true
    },
    {
      id: 2,
      title: "Paiement en retard",
      message: "3 membres ont des paiements en retard",
      time: "Il y a 1h",
      type: "warning",
      unread: true
    },
    {
      id: 3,
      title: "Rapport mensuel",
      message: "Le rapport de février est disponible",
      time: "Il y a 2h",
      type: "info",
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="header-container modern">
      <div className="header-content modern">
        {/* Contrôles de navigation */}
        <div className="header-nav-controls">
          <button 
            className="mobile-menu-button modern"
            onClick={onMobileMenuToggle}
          >
            <Menu size={20} />
          </button>

          <button 
            className="sidebar-toggle-button modern"
            onClick={onSidebarToggle}
            title={sidebarCollapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
          >
            <Sidebar size={20} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className={`search-container modern ${searchFocused ? 'focused' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher transactions, membres..."
            className="search-input modern"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="search-shortcut">⌘K</div>
        </div>

        {/* Actions utilisateur */}
        <div className="header-actions modern">
          {/* Bouton plein écran */}
          <button className="header-action-button modern" title="Plein écran">
            <Maximize size={18} />
          </button>

          {/* Toggle thème */}
          <button className="header-action-button modern" title="Changer le thème">
            <Sun size={18} />
          </button>

          {/* Notifications */}
          <div className="notifications-container">
            <button 
              className={`header-action-button modern notifications ${notificationsOpen ? 'active' : ''}`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {notificationsOpen && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>Notifications</h3>
                  <button className="mark-all-read">Tout marquer lu</button>
                </div>
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.unread ? 'unread' : ''} ${notification.type}`}
                    >
                      <div className="notification-indicator"></div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notifications-footer">
                  <button className="view-all-notifications">Voir toutes les notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Menu utilisateur */}
          <div className="user-menu modern">
            <button 
              className={`user-menu-trigger ${userMenuOpen ? 'active' : ''}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                <User size={16} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>

            {userMenuOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-avatar large">
                    <User size={20} />
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user?.name}</div>
                    <div className="user-email">{user?.email}</div>
                    <div className="user-role-badge">{user?.role}</div>
                  </div>
                </div>

                <div className="user-menu-divider"></div>

                <div className="user-menu-items">
                  <button className="user-menu-item">
                    <User size={16} />
                    <span>Mon Profil</span>
                  </button>
                  <button className="user-menu-item">
                    <Settings size={16} />
                    <span>Paramètres</span>
                  </button>
                  <button className="user-menu-item">
                    <MoreHorizontal size={16} />
                    <span>Préférences</span>
                  </button>
                </div>

                <div className="user-menu-divider"></div>

                <button className="user-menu-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar pour les actions en cours */}
      <div className="header-progress-bar">
        <div className="progress-fill"></div>
      </div>
    </header>
  );
};

export default Header;