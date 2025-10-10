/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF API

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import api from './api';

/**
 * Service pour gérer les exports PDF
 */
const pdfAPI = {
  /**
   * Télécharger un reçu de transaction
   */
  downloadReceipt: async (transactionId) => {
    try {
      const response = await api.get(`/pdf/transactions/${transactionId}/receipt`, {
        responseType: 'blob' // Important pour les fichiers binaires
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Recu_Transaction_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur téléchargement reçu:', error);
      throw error.response?.data || { message: 'Erreur lors du téléchargement du reçu' };
    }
  },
  
  /**
   * Exporter la liste des transactions
   */
  exportTransactionsList: async (filters = {}) => {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category_id', filters.category);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.amountMin) params.append('amount_min', filters.amountMin);
      if (filters.amountMax) params.append('amount_max', filters.amountMax);
      
      const response = await api.get(`/pdf/transactions/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Transactions_${today}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur export liste:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'export' };
    }
  },
  
  /**
   * Générer un rapport financier
   */
  downloadFinancialReport: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (options.year) params.append('year', options.year);
      if (options.month) params.append('month', options.month);
      if (options.start_date) params.append('start_date', options.start_date);
      if (options.end_date) params.append('end_date', options.end_date);
      
      const response = await api.get(`/pdf/report/financial?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = 'Rapport_Financier';
      if (options.year && options.month) {
        filename += `_${options.month}_${options.year}`;
      } else if (options.year) {
        filename += `_${options.year}`;
      }
      filename += '.pdf';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur rapport financier:', error);
      throw error.response?.data || { message: 'Erreur lors de la génération du rapport' };
    }
  },
  
  /**
   * Télécharger le relevé d'un membre
   */
  downloadMemberStatement: async (memberId) => {
    try {
      const response = await api.get(`/pdf/members/${memberId}/statement`, {
        responseType: 'blob'
      });
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Releve_Membre_${memberId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur relevé membre:', error);
      throw error.response?.data || { message: 'Erreur lors du téléchargement' };
    }
  },
  
  /**
   * Vérifier l'état des assets PDF
   */
  checkAssets: async () => {
    try {
      const response = await api.get('/pdf/check-assets');
      return response.data;
    } catch (error) {
      console.error('Erreur vérification assets:', error);
      throw error.response?.data || { message: 'Erreur lors de la vérification' };
    }
  }
};

export default pdfAPI;

/**
 * IMPORTANT: Ajouter cet export dans frontend/src/services/api.js:
 * 
 * export { default as pdfAPI } from './pdfAPI';
 */