/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - PDF Service COMPLET */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const { ASSETS_PATH } = require('../config/pdfConfig');

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
    return new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      autoFirstPage: false,
      compress: true,
      info: {
        Title: 'Document Club GI',
        Author: 'Club Génie Informatique',
        Subject: 'Document généré automatiquement',
        Creator: 'InvoAfrica System'
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
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Générer un reçu de transaction
   */
  static async generateReceipt(transaction) {
    const doc = this.createDocument();
    await generateReceiptPDF(doc, transaction);
    return doc;
  }

  /**
   * Générer une liste de transactions
   */
  static async generateTransactionList(transactions, filters, statistics) {
    const doc = this.createDocument();
    await generateTransactionListPDF(doc, transactions, filters, statistics);
    return doc;
  }

  /**
   * Générer un rapport financier
   */
  static async generateFinancialReport(data) {
    const doc = this.createDocument();
    await generateFinancialReportPDF(doc, data);
    return doc;
  }

  /**
   * Générer un relevé de membre
   */
  static async generateMemberStatement(member, contributions) {
    const doc = this.createDocument();
    await generateMemberStatementPDF(doc, member, contributions);
    return doc;
  }

  /**
   * ✅ NOUVEAU : Générer la liste des Team Members
   */
  static async generateTeamMembersList(teamMembers, filters) {
    const doc = this.createDocument();
    await generateTeamMembersPDF(doc, teamMembers, filters);
    return doc;
  }

  /**
   * ✅ NOUVEAU : Générer la liste des Adhérents
   */
  static async generateAdherentsList(adherents, filters) {
    const doc = this.createDocument();
    await generateAdherentsPDF(doc, adherents, filters);
    return doc;
  }

  /**
   * ✅ NOUVEAU : Générer la liste des cotisations Team
   */
  static async generateTeamContributionsList(contributions, filters) {
    const doc = this.createDocument();
    await generateTeamContributionsPDF(doc, contributions, filters);
    return doc;
  }

  /**
   * ✅ NOUVEAU : Générer la liste des abonnements Adhérents
   */
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
    
    return {
      logo: logoExists,
      signature: signatureExists,
      logoPath: ASSETS_PATH.logo,
      signaturePath: ASSETS_PATH.signature
    };
  }
}

module.exports = PDFService;