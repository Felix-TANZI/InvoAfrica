/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import axios from 'axios';
import toast from 'react-hot-toast';

// Configuration de base de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer l'instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'autorisation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('invoafrica_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    // Réponse réussie
    return response.data;
  },
  (error) => {
    // Gestion des erreurs
    const { response } = error;
    
    if (!response) {
      // Erreur réseau
      toast.error('Erreur de connexion au serveur');
      return Promise.reject({ message: 'Erreur réseau' });
    }
    
    const { status, data } = response;
    
    switch (status) {
      case 401:
        // Non autorisé - token invalide/expiré
        localStorage.removeItem('invoafrica_token');
        localStorage.removeItem('invoafrica_user');
        
        if (window.location.pathname !== '/login') {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        }
        break;
        
      case 403:
        // Accès interdit
        toast.error('Vous n\'êtes pas autorisé à effectuer cette action');
        break;
        
      case 404:
        // Ressource non trouvée
        toast.error('Ressource non trouvée');
        break;
        
      case 409:
        // Conflit (ex: email déjà existant)
        toast.error(data.message || 'Conflit de données');
        break;
        
      case 422:
        // Erreur de validation
        toast.error(data.message || 'Données invalides');
        break;
        
      case 429:
        // Trop de requêtes
        toast.error('Trop de requêtes. Veuillez patienter.');
        break;
        
      case 500:
        // Erreur serveur
        toast.error('Erreur interne du serveur');
        break;
        
      default:
        // Autres erreurs
        toast.error(data?.message || 'Une erreur inattendue s\'est produite');
    }
    
    return Promise.reject({
      status,
      message: data?.message || 'Erreur API',
      data: data?.data || null,
    });
  }
);

// Fonctions d'API réutilisables
export const apiRequest = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
};

// Fonctions spécifiques par domaine
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  verifyToken: () => api.get('/auth/verify'),
};

export const transactionAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  validate: (id) => api.post(`/transactions/${id}/validate`),
  cancel: (id, reason) => api.post(`/transactions/${id}/cancel`, { reason }),
  getStats: (params = {}) => api.get('/transactions/stats', { params }),
};

export const categoryAPI = {
  getAll: (params = {}) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
};

export const memberAPI = {
  getTeamMembers: (params = {}) => api.get('/members/team', { params }),
  createTeamMember: (data) => api.post('/members/team', data),
  updateTeamMember: (id, data) => api.put(`/members/team/${id}`, data),
  
  getAdherents: (params = {}) => api.get('/members/adherents', { params }),
  createAdherent: (data) => api.post('/members/adherents', data),
  updateAdherent: (id, data) => api.put(`/members/adherents/${id}`, data),
};

export const contributionAPI = {
  generateTeam: (data) => api.post('/contributions/generate/team', data),
  generateAdherents: (data) => api.post('/contributions/generate/adherents', data),
  generateCurrent: () => api.post('/contributions/generate/current'),
  
  getTeamContributions: (params = {}) => api.get('/contributions/team', { params }),
  getAdherentContributions: (params = {}) => api.get('/contributions/adherents', { params }),
  
  markTeamPaid: (id, data) => api.put(`/contributions/team/${id}/pay`, data),
  markAdherentPaid: (id, data) => api.put(`/contributions/adherents/${id}/pay`, data),
};

export const dashboardAPI = {
  getStats: (params = {}) => api.get('/dashboard/stats', { params }),
  getRecentTransactions: (params = {}) => api.get('/dashboard/recent-transactions', { params }),
  getLateContributions: () => api.get('/dashboard/late-contributions'),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
};

export default api;