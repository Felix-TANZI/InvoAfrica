/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - PDF Configuration */

const path = require('path');

// Informations du Club
const CLUB_INFO = {
  name: 'Club Génie Informatique',
  shortName: 'Club GI',
  address: 'École Nationale Supérieure Polytechnique de Yaoundé',
  addressLine2: 'BP 8390, Yaoundé, Cameroun',
  phone: '+237 683 86 24 42',
  email: 'clubinfoenspy@gmail.com',
  website: 'gi-enspy.com',
  
  signatory: {
    name: 'Felix NZIKO',
    title: 'Chef de la Cellule Financière',
    subtitle: 'Étudiant en 4e année Génie Informatique',
    phone: '+237 698200792'
  },
  
  // THÈME BLEU
  colors: {
    primary: '#004aad',
    primaryLight: '#e6f0ff',
    secondary: '#0066cc',
    accent: '#0088ff',
    
    text: '#111111',
    textLight: '#555555',
    textMuted: '#888888',
    
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    
    bgWhite: '#FFFFFF',
    bgLight: '#F9FAFB',
    bgBlueLight: '#e6f0ff',
    
    border: '#E5E7EB',
    borderDark: '#D1D5DB'
  }
};

const ASSETS_PATH = {
  logo: path.join(__dirname, '../assets/logo-ClubGI.png'),
  signature: path.join(__dirname, '../assets/signFelix.png'),
};

const PDF_CONFIG = {
  margins: {
    top: 70,
    bottom: 80,
    left: 50,
    right: 50
  },
  
  fonts: {
    title: 22,
    heading: 16,
    subheading: 14,
    body: 11,
    small: 9,
    tiny: 8
  },
  
  dimensions: {
    pageWidth: 595.28,
    pageHeight: 841.89,
    logoWidth: 70,
    logoHeight: 70,
    signatureWidth: 100,
    signatureHeight: 50,
    qrCodeSize: 90
  },
  
  defaultOptions: {
    size: 'A4',
    margin: 50,
    bufferPages: true,
    autoFirstPage: false,
    compress: true
  },
  
  table: {
    headerHeight: 30,
    rowHeight: 25,
    rowHeightAuto: true,
    padding: 8,
    borderWidth: 0.5,
    alternateRows: true
  }
};

const PDF_TYPES = {
  RECEIPT: 'receipt',
  TRANSACTION_LIST: 'transaction_list',
  FINANCIAL_REPORT: 'financial_report',
  MEMBER_STATEMENT: 'member_statement'
};


const PDF_TEXTS = {
  receipt: {
    title: 'REÇU DE TRANSACTION',
    subtitle: 'Document officiel du Club GI',
    footer: 'Document généré automatiquement par le Système de gestion du Club GI — gi-enspy.com',
    qrText: 'Scannez pour vérifier\nla validité du reçu en ligne',
    certification: 'Signé électroniquement et certifié par le Club GI.',
    location: 'Yaoundé'
  },
  
  transactionList: {
    title: 'LISTE DES TRANSACTIONS',
    subtitle: 'Export des données financières',
    footer: 'Document généré automatiquement par le Système de gestion du Club GI — gi-enspy.com',
    noData: 'Aucune transaction trouvée pour les critères sélectionnés'
  },
  
  financialReport: {
    title: 'RAPPORT FINANCIER',
    subtitle: 'Analyse détaillée de la période',
    footer: 'Rapport officiel du Club Génie Informatique',
    commentSection: 'Observations et Commentaires',
    summaryTitle: 'Résumé Financier'
  },
  
  memberStatement: {
    title: 'RELEVÉ DE COTISATIONS',
    subtitle: 'Historique des paiements',
    footer: 'Document officiel du Club GI',
    memberInfo: 'Informations du Membre'
  }
};

//  Statuts avec icônes ASCII simples
const STATUS_LABELS = {
  'en_attente': { text: 'En attente', color: '#f59e0b', icon: '◷' },
  'validee': { text: 'Validée', color: '#10b981', icon: '✓' },
  'annulee': { text: 'Annulée', color: '#ef4444', icon: '✗' }
};

const TYPE_LABELS = {
  'recette': { text: 'Recette', color: '#10b981', icon: '↗' },
  'depense': { text: 'Dépense', color: '#ef4444', icon: '↘' }
};

const PAYMENT_MODE_LABELS = {
  'cash': 'Espèces',
  'om': 'Orange Money',
  'momo': 'Mobile Money',
  'virement': 'Virement bancaire',
  'cheque': 'Chèque'
};

const getStatusLabel = (status) => STATUS_LABELS[status] || { text: status, color: '#666666', icon: '' };
const getTypeLabel = (type) => TYPE_LABELS[type] || { text: type, color: '#666666', icon: '' };

module.exports = {
  CLUB_INFO,
  ASSETS_PATH,
  PDF_CONFIG,
  PDF_TYPES,
  PDF_TEXTS,
  STATUS_LABELS,
  TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  getStatusLabel,
  getTypeLabel
};