/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

// Formatage des montants en FCFA
export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

// Formatage des dates
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

// Formatage des status avec couleurs
export const getStatusBadge = (status) => {
  const statusMap = {
    'en_attente': { label: 'En attente', color: 'warning' },
    'validee': { label: 'Validée', color: 'success' },
    'annulee': { label: 'Annulée', color: 'danger' },
    'paye': { label: 'Payé', color: 'success' }
  };
  
  return statusMap[status] || { label: status, color: 'info' };
};