/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF API Client

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import axios from 'axios';

// Configuration de base pour les requêtes PDF
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios SANS l'intercepteur qui transforme response.data
const pdfApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour les PDF
  headers: {
    'Content-Type': 'application/json',
  },
  responseType: 'blob' // Toujours en blob pour les PDF
});

// Intercepteur UNIQUEMENT pour ajouter le token
pdfApiClient.interceptors.request.use(
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

// Intercepteur d'erreur simplifié (sans toucher aux données de succès)
pdfApiClient.interceptors.response.use(
  (response) => response, // ✅ Retourne la réponse complète, pas response.data
  (error) => {
    const { response } = error;
    
    if (!response) {
      return Promise.reject({ message: 'Erreur réseau' });
    }
    
    const { status } = response;
    
    if (status === 401) {
      localStorage.removeItem('invoafrica_token');
      localStorage.removeItem('invoafrica_user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject({
      status,
      message: 'Erreur lors de la génération du PDF'
    });
  }
);

export default pdfApiClient;