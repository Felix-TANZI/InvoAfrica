/* Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.2 - PDF Service FINAL (CORRIGÉ) */

const PDFDocument = require('pdfkit');
const fs = require('fs');
// Assurez-vous d'avoir 'moment' installé: npm install moment
const moment = require('moment'); 
const { ASSETS_PATH, PDF_CONFIG } = require('../config/pdfConfig'); 
moment.locale('fr');

const {
  generateReceiptPDF,
  generateTransactionListPDF,
  generateFinancialReportPDF,
  generateMemberStatementPDF,
  generateTeamMembersPDF,
  generateAdherentsPDF,
  generateTeamContributionsPDF,
  generateAdherentContributionsPDF
} = require('./pdfTemplates');

/**
 * Service pour gérer la génération de PDF
 */
class PDFService {
  /**
   * Créer un nouveau document PDF
   */
  static createDocument() {
    // CORRECTION CRITIQUE: Créer un objet Date() pour pdfkit.info
    const docCreationDate = new Date(); 
    
    return new PDFDocument({
      size: 'A4',
      margin: PDF_CONFIG.margins.left, 
      bufferPages: true,
      autoFirstPage: false,
      compress: true,
      info: {
        Title: 'Document Club GI',
        Author: 'Club Génie Informatique',
        Subject: 'Document généré automatiquement',
        Creator: 'InvoAfrica System',
        // Utiliser l'objet Date JavaScript ici
        CreationDate: docCreationDate 
      }
    });
  }

  /**
   * Convertir un document PDF en buffer
   */
  static toBuffer(doc) {
    return new Promise((resolve, reject) => {
      try {
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Les fonctions de génération sont inchangées...
  
  static async generateReceipt(transaction) {
    const doc = this.createDocument();
    await generateReceiptPDF(doc, transaction);
    return doc;
  }
  
  static async generateTransactionList(transactions, filters, statistics) {
    const doc = this.createDocument();
    await generateTransactionListPDF(doc, transactions, filters, statistics);
    return doc;
  }
  
  static async generateFinancialReport(data) {
    const doc = this.createDocument();
    await generateFinancialReportPDF(doc, data);
    return doc;
  }
  
  static async generateMemberStatement(member, contributions) {
    const doc = this.createDocument();
    await generateMemberStatementPDF(doc, member, contributions);
    return doc;
  }
  
  static async generateTeamMembersList(teamMembers, filters) {
    const doc = this.createDocument();
    await generateTeamMembersPDF(doc, teamMembers, filters);
    return doc;
  }

  static async generateAdherentsList(adherents, filters) {
    const doc = this.createDocument();
    await generateAdherentsPDF(doc, adherents, filters);
    return doc;
  }

  static async generateTeamContributionsList(contributions, filters) {
    const doc = this.createDocument();
    await generateTeamContributionsPDF(doc, contributions, filters);
    return doc;
  }

  static async generateAdherentContributionsList(contributions, filters) {
    const doc = this.createDocument();
    await generateAdherentContributionsPDF(doc, contributions, filters);
    return doc;
  }

  /**
   * Vérifier la disponibilité des assets
   */
  static checkAssets() {
    const logoExists = fs.existsSync(ASSETS_PATH.logo);
    const signatureExists = fs.existsSync(ASSETS_PATH.signature);
    
    console.log('🔍 Vérification des assets PDF:');
    console.log(`  Logo: ${logoExists ? '✅' : '❌'} (${ASSETS_PATH.logo})`);
    console.log(`  Signature: ${signatureExists ? '✅' : '❌'} (${ASSETS_PATH.signature})`);
    
    if (!logoExists || !signatureExists) {
        console.warn("⚠️ AVERTISSEMENT: Certains assets (Logo/Signature) sont manquants. Le PDF affichera des placeholders.");
    }
  }
}

module.exports = PDFService;