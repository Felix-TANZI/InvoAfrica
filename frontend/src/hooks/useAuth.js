/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { authAPI } from '../services/api';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  checkAuthStart,
  checkAuthSuccess,
  checkAuthFailure,
  selectAuth,
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthLoading,
  selectUserRole,
} from '../store/slices/authSlice';

// Hook principal d'authentification
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);

  // Fonction de connexion
  const login = async (credentials) => {
    try {
      dispatch(loginStart());
      
      const response = await authAPI.login(credentials);
      
      if (response.status === 'success') {
        const { user, token } = response.data;
        
        dispatch(loginSuccess({ user, token }));
        toast.success(`Bienvenue, ${user.name} !`);
        navigate('/dashboard');
        
        return { success: true };
      }
    } catch (error) {
      dispatch(loginFailure(error.message || 'Erreur de connexion'));
      toast.error(error.message || 'Erreur de connexion');
      return { success: false, error: error.message };
    }
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    dispatch(logout());
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  // Fonction de changement de mot de passe
  const changePassword = async (passwords) => {
    try {
      const response = await authAPI.changePassword(passwords);
      
      if (response.status === 'success') {
        toast.success('Mot de passe modifié avec succès');
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
      return { success: false, error: error.message };
    }
  };

  return {
    ...auth,
    login,
    logout: handleLogout,
    changePassword,
  };
};

// Hook pour vérifier l'authentification au démarrage
export const useAuthCheck = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('invoafrica_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        dispatch(checkAuthStart());
        const response = await authAPI.verifyToken();
        
        if (response.status === 'success') {
          dispatch(checkAuthSuccess(response.data.user));
        } else {
          dispatch(checkAuthFailure());
        }
      } catch (error) {
        dispatch(checkAuthFailure());
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  return { isLoading, isAuthenticated };
};

// Hook pour vérifier les permissions par rôle
export const usePermissions = () => {
  const user = useSelector(selectCurrentUser);
  const userRole = useSelector(selectUserRole);

  const hasRole = (roles) => {
    if (!user || !userRole) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    
    return userRole === roles;
  };

  const isAdmin = () => hasRole('admin');
  const isTresorier = () => hasRole('tresorier');
  const isCommissaire = () => hasRole('commissaire');
  const canManageUsers = () => isAdmin();
  const canValidateTransactions = () => isAdmin();
  const canCreateTransactions = () => hasRole(['admin', 'tresorier', 'commissaire']);
  const canViewReports = () => hasRole(['admin', 'tresorier', 'commissaire']);

  return {
    user,
    userRole,
    hasRole,
    isAdmin,
    isTresorier,
    isCommissaire,
    canManageUsers,
    canValidateTransactions,
    canCreateTransactions,
    canViewReports,
  };
};

// Hook pour gérer le profil utilisateur
export const useProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const loading = useSelector(selectAuthLoading);

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.status === 'success') {
        dispatch(updateProfile(response.data.user));
        toast.success('Profil mis à jour avec succès');
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    updateProfile,
  };
};