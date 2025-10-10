/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Service

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { 
  ASSETS_PATH, 
  PDF_CONFIG, 
  PDF_TYPES,
  PDF_TEXTS 
} = require('../config/pdfConfig');
const {
  drawHeader,
  drawFooter,
  generateQRCode
} = require('../utils/pdfHelpers');

// Import des templates
const {
  generateReceiptPDF,
  generateTransactionListPDF,
  generateFinancialReportPDF,
  generateMemberStatementPDF
} = require('./pdfTemplates');

/**
 * Classe principale de génération PDF
 */
class PDFService {
  
  /**
   * Créer un nouveau document PDF
   */
  static createDocument(options = {}) {
    const defaultOptions = {
      ...PDF_CONFIG.defaultOptions,
      info: {
        Title: options.title || 'Document Club GI',
        Author: 'Club Génie Informatique',
        Subject: options.subject || 'Document financier',
        Creator: 'InvoAfrica System'
      }
    };
    
    return new PDFDocument(defaultOptions);
  }
  
  /**
   * Générer un reçu de transaction
   */
  static async generateReceipt(transaction) {
    try {
      console.log('📄 Génération du reçu pour transaction:', transaction.reference);
      
      const doc = this.createDocument({
        title: `Reçu - ${transaction.reference}`,
        subject: 'Reçu de transaction'
      });
      
      // Générer le contenu
      await generateReceiptPDF(doc, transaction);
      
      return doc;
    } catch (error) {
      console.error('❌ Erreur génération reçu:', error);
      throw new Error(`Erreur lors de la génération du reçu: ${error.message}`);
    }
  }
  
  /**
   * Générer une liste de transactions
   */
  static async generateTransactionList(transactions, filters = {}, statistics = {}) {
    try {
      console.log('📄 Génération liste de', transactions.length, 'transactions');
      
      const doc = this.createDocument({
        title: 'Liste des Transactions',
        subject: 'Export des transactions'
      });
      
      // Générer le contenu
      await generateTransactionListPDF(doc, transactions, filters, statistics);
      
      return doc;
    } catch (error) {
      console.error('❌ Erreur génération liste:', error);
      throw new Error(`Erreur lors de la génération de la liste: ${error.message}`);
    }
  }
  
  /**
   * Générer un rapport financier
   */
  static async generateFinancialReport(data) {
    try {
      console.log('📄 Génération rapport financier pour période:', data.period);
      
      const doc = this.createDocument({
        title: `Rapport Financier - ${data.period}`,
        subject: 'Rapport financier périodique'
      });
      
      // Générer le contenu
      await generateFinancialReportPDF(doc, data);
      
      return doc;
    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      throw new Error(`Erreur lors de la génération du rapport: ${error.message}`);
    }
  }
  
  /**
   * Générer un relevé membre
   */
  static async generateMemberStatement(member, contributions) {
    try {
      console.log('📄 Génération relevé pour membre:', member.name);
      
      const doc = this.createDocument({
        title: `Relevé - ${member.name}`,
        subject: 'Relevé de cotisations'
      });
      
      // Générer le contenu
      await generateMemberStatementPDF(doc, member, contributions);
      
      return doc;
    } catch (error) {
      console.error('❌ Erreur génération relevé membre:', error);
      throw new Error(`Erreur lors de la génération du relevé: ${error.message}`);
    }
  }
  
  /**
   * Sauvegarder le PDF dans un fichier
   */
  static async saveToFile(doc, filename) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(__dirname, '../uploads/pdfs', filename);
      
      // Créer le dossier s'il n'existe pas
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      doc.end();
      
      stream.on('finish', () => {
        console.log('✅ PDF sauvegardé:', outputPath);
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        console.error('❌ Erreur sauvegarde PDF:', error);
        reject(error);
      });
    });
  }
  
  /**
   * Convertir le PDF en buffer (pour envoi HTTP)
   */
  static async toBuffer(doc) {
    return new Promise((resolve, reject) => {
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      doc.end();
    });
  }
  
  /**
   * Vérifier que les assets existent
   */
  static checkAssets() {
    const assets = {
      logo: fs.existsSync(ASSETS_PATH.logo),
      signature: fs.existsSync(ASSETS_PATH.signature)
    };
    
    if (!assets.logo) {
      console.warn('⚠️  Logo non trouvé:', ASSETS_PATH.logo);
    }
    
    if (!assets.signature) {
      console.warn('⚠️  Signature non trouvée:', ASSETS_PATH.signature);
    }
    
    return assets;
  }
}

module.exports = PDFService;