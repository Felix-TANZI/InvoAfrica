/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React from 'react';
import { useSelector } from 'react-redux';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const Header = ({ onMobileMenuToggle }) => {
  const user = useSelector(selectCurrentUser);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header-container">
      <div className="header-content">
        {/* Menu mobile */}
        <button 
          className="mobile-menu-button"
          onClick={onMobileMenuToggle}
        >
          <Menu size={24} />
        </button>

        {/* Titre */}
        <div className="header-title">
          <h1>InvoAfrica</h1>
        </div>

        {/* Actions utilisateur */}
        <div className="header-actions">
          <button className="header-action-button">
            <Bell size={20} />
          </button>

          <div className="user-menu">
            <div className="user-info">
              <User size={20} />
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            
            <button 
              className="logout-button"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;