/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleMobileMenu, selectMobileMenuOpen } from '../../store/slices/uiSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = () => {
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);

  const handleMobileMenuToggle = () => {
    dispatch(toggleMobileMenu());
  };

  return (
    <div className="layout-container">
      {/* Sidebar Desktop */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Sidebar Mobile + Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="mobile-menu-overlay"
            onClick={handleMobileMenuToggle}
          ></div>
          <div className="mobile-sidebar">
            <Sidebar mobile onClose={handleMobileMenuToggle} />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="main-content">
        <Header onMobileMenuToggle={handleMobileMenuToggle} />
        
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;