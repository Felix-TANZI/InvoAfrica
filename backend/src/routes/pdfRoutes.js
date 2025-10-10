/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Routes - VERSION FINALE

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const express = require('express');
const router = express.Router();
const {
  generateTransactionReceipt,
  exportTransactionsList,
  generateFinancialReport,
  generateMemberStatement,
  checkPdfAssets
} = require('../controllers/pdfController');

// ✅ Import du middleware d'authentification existant (CORRIGÉ)
const { 
  authenticateToken, 
  authorizeRoles,
  adminOnly,
  adminOrTresorier 
} = require('../middleware/auth');

/**
 * @route   GET /api/pdf/check-assets
 * @desc    Vérifier l'état des assets (logo, signature)
 * @access  Private (Admin)
 */
router.get('/check-assets', authenticateToken, adminOnly, checkPdfAssets);

/**
 * @route   GET /api/pdf/transactions/:id/receipt
 * @desc    Générer un reçu pour une transaction
 * @access  Private
 */
router.get('/transactions/:id/receipt', authenticateToken, generateTransactionReceipt);

/**
 * @route   GET /api/pdf/transactions/export
 * @desc    Exporter la liste des transactions en PDF
 * @access  Private
 * @query   status, type, category_id, date_from, date_to, search, amount_min, amount_max
 */
router.get('/transactions/export', authenticateToken, exportTransactionsList);

/**
 * @route   GET /api/pdf/report/financial
 * @desc    Générer un rapport financier
 * @access  Private (Admin ou Trésorier)
 * @query   year, month, start_date, end_date
 */
router.get('/report/financial', authenticateToken, adminOrTresorier, generateFinancialReport);

/**
 * @route   GET /api/pdf/members/:id/statement
 * @desc    Générer un relevé de cotisations pour un membre
 * @access  Private
 */
router.get('/members/:id/statement', authenticateToken, generateMemberStatement);

module.exports = router;