/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  UserPlus, 
  DollarSign,
  Settings,
  X 
} from 'lucide-react';
import { usePermissions } from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = ({ mobile = false, onClose }) => {
  const { hasRole } = usePermissions();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: CreditCard },
    { name: 'Team Members', href: '/team-members', icon: Users, roles: ['admin'] },
    { name: 'Adhérents', href: '/adherents', icon: UserPlus, roles: ['admin'] },
    { name: 'Cotisations', href: '/contributions', icon: DollarSign },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const handleLinkClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="sidebar">
      {/* Header sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <h2>InvoAfrica</h2>
          <span>Club GI</span>
        </div>
        
        {mobile && (
          <button className="sidebar-close" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigationItems.map((item) => {
            // Contrôle d'accès : si l'item a des rôles requis, vérifier les permissions
            if (item.roles && !item.roles.some(role => hasRole(role))) {
              return null;
            }

            const Icon = item.icon;
            return (
              <li key={item.name} className="nav-item">
                <NavLink
                  to={item.href}
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                  onClick={handleLinkClick}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;