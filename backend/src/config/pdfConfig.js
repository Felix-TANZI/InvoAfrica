/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Configuration

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

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
  
  // Signataire
  signatory: {
    name: 'Felix NZIKO',
    title: 'Chef de la Cellule Financière',
    subtitle: 'Étudiant en 4e année Génie Informatique',
    phone: '+237 698200792'
  },
  
  // Couleurs du club (orange)
  colors: {
    primary: '#FF8C00',      // Orange foncé
    secondary: '#FFA500',    // Orange
    light: '#FFE5B4',        // Orange clair
    dark: '#CC7000',         // Orange très foncé
    text: '#333333',
    textLight: '#666666',
    success: '#10b981',
    danger: '#ef4444'
  }
};

// Chemins des assets
const ASSETS_PATH = {
  logo: path.join(__dirname, '../assets/logo-ClubGI.png'),
  signature: path.join(__dirname, '../assets/signFelix.png'),
};

// Configuration des documents PDF
const PDF_CONFIG = {
  // Marges du document
  margins: {
    top: 60,
    bottom: 60,
    left: 50,
    right: 50
  },
  
  // Tailles de police
  fonts: {
    title: 20,
    heading: 16,
    subheading: 14,
    body: 11,
    small: 9,
    tiny: 8
  },
  
  // Dimensions
  dimensions: {
    pageWidth: 595.28,  // A4 width in points
    pageHeight: 841.89, // A4 height in points
    logoWidth: 80,
    logoHeight: 80,
    signatureWidth: 120,
    signatureHeight: 60,
    qrCodeSize: 80
  },
  
  // Options par défaut
  defaultOptions: {
    size: 'A4',
    margin: 50,
    bufferPages: true,
    autoFirstPage: false
  }
};

// Types de documents PDF
const PDF_TYPES = {
  RECEIPT: 'receipt',              // Reçu individuel
  TRANSACTION_LIST: 'transaction_list', // Liste des transactions
  FINANCIAL_REPORT: 'financial_report', // Rapport financier
  MEMBER_STATEMENT: 'member_statement'  // Relevé membre
};

// Templates de textes
const PDF_TEXTS = {
  receipt: {
    title: 'REÇU DE TRANSACTION',
    subtitle: 'Document officiel',
    footer: 'Ce document est généré automatiquement et certifié par le Club GI.',
    qrText: 'Scannez pour vérifier'
  },
  
  transactionList: {
    title: 'LISTE DES TRANSACTIONS',
    subtitle: 'Export des données financières',
    footer: 'Document généré par InvoAfrica - Système de gestion du Club GI'
  },
  
  financialReport: {
    title: 'RAPPORT FINANCIER',
    subtitle: 'Analyse de la période',
    footer: 'Rapport officiel du Club Génie Informatique'
  },
  
  memberStatement: {
    title: 'RELEVÉ DE COTISATIONS',
    subtitle: 'Historique des paiements',
    footer: 'Document officiel du Club GI'
  }
};

// Statuts et types traduits
const STATUS_LABELS = {
  'en_attente': 'En attente',
  'validee': 'Validée',
  'annulee': 'Annulée'
};

const TYPE_LABELS = {
  'recette': 'Recette',
  'depense': 'Dépense'
};

const PAYMENT_MODE_LABELS = {
  'cash': 'Espèces',
  'om': 'Orange Money',
  'momo': 'Mobile Money',
  'virement': 'Virement',
  'cheque': 'Chèque'
};

module.exports = {
  CLUB_INFO,
  ASSETS_PATH,
  PDF_CONFIG,
  PDF_TYPES,
  PDF_TEXTS,
  STATUS_LABELS,
  TYPE_LABELS,
  PAYMENT_MODE_LABELS
};