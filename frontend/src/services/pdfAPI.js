/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 2.0 - PDF API COMPLET

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import pdfApiClient from './pdfAPIClient';

/**
 * Service pour gérer les exports PDF
 */
const pdfAPI = {
  /**
   * Télécharger un reçu de transaction
   */
  downloadReceipt: async (transactionId) => {
    try {
      const response = await pdfApiClient.get(`/pdf/transactions/${transactionId}/receipt`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Recu_Transaction_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur téléchargement reçu:', error);
      throw error.response?.data || { message: 'Erreur lors du téléchargement du reçu' };
    }
  },
  
  /**
   * Exporter la liste des transactions
   */
  exportTransactionsList: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category_id', filters.category);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
      if (filters.amountMin) params.append('amount_min', filters.amountMin);
      if (filters.amountMax) params.append('amount_max', filters.amountMax);
      
      const response = await pdfApiClient.get(`/pdf/transactions/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
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
      console.error('❌ Erreur export liste:', error);
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
      
      const response = await pdfApiClient.get(`/pdf/report/financial?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
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
      console.error('❌ Erreur rapport financier:', error);
      throw error.response?.data || { message: 'Erreur lors de la génération du rapport' };
    }
  },
  
  /**
   * Télécharger le relevé d'un membre
   */
  downloadMemberStatement: async (memberId) => {
    try {
      const response = await pdfApiClient.get(`/pdf/members/${memberId}/statement`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Releve_Membre_${memberId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur relevé membre:', error);
      throw error.response?.data || { message: 'Erreur lors du téléchargement' };
    }
  },

  /**
   * ✅ NOUVEAU : Exporter la liste des Team Members
   */
  exportTeamMembers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.contribution_status) params.append('contribution_status', filters.contribution_status);
      
      const response = await pdfApiClient.get(`/pdf/team-members/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Team_Members_${today}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur export team members:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'export' };
    }
  },

  /**
   * ✅ NOUVEAU : Exporter la liste des Adhérents
   */
  exportAdherents: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.subscription_status) params.append('subscription_status', filters.subscription_status);
      
      const response = await pdfApiClient.get(`/pdf/adherents/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Adherents_${today}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur export adhérents:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'export' };
    }
  },

  /**
   * ✅ NOUVEAU : Exporter les cotisations Team Members
   */
  exportTeamContributions: async (options = {}) => {
    try {
      const currentDate = new Date();
      const params = new URLSearchParams();
      
      params.append('year', options.year || currentDate.getFullYear());
      params.append('month', options.month || (currentDate.getMonth() + 1));
      
      if (options.paid) params.append('paid', options.paid); // 'yes' ou 'no'
      
      const response = await pdfApiClient.get(`/pdf/contributions/team/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      
      const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 
                          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
      const month = options.month || (currentDate.getMonth() + 1);
      const year = options.year || currentDate.getFullYear();
      
      link.setAttribute('download', `Cotisations_Team_${monthNames[month - 1]}_${year}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur export cotisations team:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'export' };
    }
  },

  /**
   * ✅ NOUVEAU : Exporter les abonnements Adhérents
   */
  exportAdherentContributions: async (options = {}) => {
    try {
      const currentDate = new Date();
      const params = new URLSearchParams();
      
      params.append('year', options.year || currentDate.getFullYear());
      params.append('month', options.month || (currentDate.getMonth() + 1));
      
      if (options.paid) params.append('paid', options.paid); // 'yes' ou 'no'
      
      const response = await pdfApiClient.get(`/pdf/contributions/adherents/export?${params.toString()}`);
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      
      const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 
                          'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
      const month = options.month || (currentDate.getMonth() + 1);
      const year = options.year || currentDate.getFullYear();
      
      link.setAttribute('download', `Abonnements_Adherents_${monthNames[month - 1]}_${year}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur export abonnements adhérents:', error);
      throw error.response?.data || { message: 'Erreur lors de l\'export' };
    }
  },
  
  /**
   * Vérifier l'état des assets PDF
   */
  checkAssets: async () => {
    try {
      const { default: api } = await import('./api');
      const response = await api.get('/pdf/check-assets');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur vérification assets:', error);
      throw error.response?.data || { message: 'Erreur lors de la vérification' };
    }
  }
};

export default pdfAPI;