/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Navigation mobile
  isMobileMenuOpen: false,
  
  // Modales
  activeModal: null,
  modalData: null,
  
  // Loading states
  globalLoading: false,
  loadingActions: {},
  
  // Notifications
  notifications: [],
  
  // Sidebar état (pour desktop)
  sidebarCollapsed: false,
  
  // Thème
  theme: 'light',
  
  // Filtres actifs
  activeFilters: {},
  
  // Pagination
  pagination: {
    transactions: { page: 1, limit: 20 },
    teamContributions: { page: 1, limit: 20 },
    adherentContributions: { page: 1, limit: 20 },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation mobile
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    
    // Gestion des modales
    openModal: (state, action) => {
      const { modalName, data = null } = action.payload;
      state.activeModal = modalName;
      state.modalData = data;
    },
    
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
    
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    setActionLoading: (state, action) => {
      const { action: actionName, loading } = action.payload;
      state.loadingActions[actionName] = loading;
    },
    
    clearActionLoading: (state, action) => {
      const actionName = action.payload;
      delete state.loadingActions[actionName];
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== id);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Thème
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('invoafrica_theme', state.theme);
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('invoafrica_theme', state.theme);
    },
    
    // Filtres
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.activeFilters[key] = value;
    },
    
    clearFilter: (state, action) => {
      const key = action.payload;
      delete state.activeFilters[key];
    },
    
    clearAllFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Pagination
    setPagination: (state, action) => {
      const { section, page, limit } = action.payload;
      if (state.pagination[section]) {
        state.pagination[section] = { ...state.pagination[section], page, limit };
      }
    },
    
    resetPagination: (state, action) => {
      const section = action.payload;
      if (state.pagination[section]) {
        state.pagination[section] = { page: 1, limit: 20 };
      }
    },
  },
});

export const {
  toggleMobileMenu,
  closeMobileMenu,
  openModal,
  closeModal,
  setGlobalLoading,
  setActionLoading,
  clearActionLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  toggleSidebar,
  setSidebarCollapsed,
  toggleTheme,
  setTheme,
  setFilter,
  clearFilter,
  clearAllFilters,
  setPagination,
  resetPagination,
} = uiSlice.actions;

// Sélecteurs
export const selectMobileMenuOpen = (state) => state.ui.isMobileMenuOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalData = (state) => state.ui.modalData;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectActionLoading = (actionName) => (state) => 
  state.ui.loadingActions[actionName] || false;
export const selectNotifications = (state) => state.ui.notifications;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectTheme = (state) => state.ui.theme;
export const selectActiveFilters = (state) => state.ui.activeFilters;
export const selectPagination = (section) => (state) => 
  state.ui.pagination[section] || { page: 1, limit: 20 };

export default uiSlice.reducer;