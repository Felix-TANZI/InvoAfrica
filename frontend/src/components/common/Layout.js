/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleMobileMenu, selectMobileMenuOpen } from '../../store/slices/uiSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleMobileMenuToggle = () => {
    dispatch(toggleMobileMenu());
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="layout-container modern">
      {/* Sidebar Desktop */}
      <div className={`sidebar-desktop modern ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      </div>

      {/* Sidebar Mobile + Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-overlay modern"
            onClick={handleMobileMenuToggle}
          ></div>
          <div className="mobile-sidebar modern">
            <Sidebar mobile onClose={handleMobileMenuToggle} />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className={`main-content modern ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          onMobileMenuToggle={handleMobileMenuToggle}
          onSidebarToggle={handleSidebarToggle}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="page-content modern">
          <div className="page-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating elements pour l'ambiance */}
      <div className="floating-elements">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>
    </div>
  );
};

export default Layout;