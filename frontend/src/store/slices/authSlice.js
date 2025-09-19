/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import { createSlice } from '@reduxjs/toolkit';

// Récupérer les données depuis localStorage au démarrage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('invoafrica_token');
    const user = localStorage.getItem('invoafrica_user');
    
    if (token && user) {
      return {
        isAuthenticated: true,
        token,
        user: JSON.parse(user),
        loading: false,
        error: null,
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données auth:', error);
    // Nettoyer localStorage si corrompu
    localStorage.removeItem('invoafrica_token');
    localStorage.removeItem('invoafrica_user');
  }
  
  return {
    isAuthenticated: false,
    token: null,
    user: null,
    loading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    // Démarrer le processus de connexion
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    
    // Connexion réussie
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      
      state.isAuthenticated = true;
      state.token = token;
      state.user = user;
      state.loading = false;
      state.error = null;
      
      // Sauvegarder dans localStorage
      localStorage.setItem('invoafrica_token', token);
      localStorage.setItem('invoafrica_user', JSON.stringify(user));
    },
    
    // Échec de connexion
    loginFailure: (state, action) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = action.payload;
      
      // Nettoyer localStorage
      localStorage.removeItem('invoafrica_token');
      localStorage.removeItem('invoafrica_user');
    },
    
    // Déconnexion
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      
      // Nettoyer localStorage
      localStorage.removeItem('invoafrica_token');
      localStorage.removeItem('invoafrica_user');
    },
    
    // Mise à jour du profil utilisateur
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('invoafrica_user', JSON.stringify(state.user));
    },
    
    // Effacer les erreurs
    clearError: (state) => {
      state.error = null;
    },
    
    // Vérifier la validité du token (après rechargement par exemple)
    checkAuthStart: (state) => {
      state.loading = true;
    },
    
    checkAuthSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      state.loading = false;
      state.error = null;
    },
    
    checkAuthFailure: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = 'Session expirée';
      
      // Nettoyer localStorage
      localStorage.removeItem('invoafrica_token');
      localStorage.removeItem('invoafrica_user');
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  clearError,
  checkAuthStart,
  checkAuthSuccess,
  checkAuthFailure,
} = authSlice.actions;

// Sélecteurs
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;