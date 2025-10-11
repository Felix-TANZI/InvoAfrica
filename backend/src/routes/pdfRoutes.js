/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - PDF Routes COMPLET

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');

// ✅ Toutes les routes PDF nécessitent l'authentification
router.use(authenticate);

/**
 * @route   GET /api/pdf/transactions/:id/receipt
 * @desc    Générer un reçu pour une transaction
 * @access  Private
 */
router.get('/transactions/:id/receipt', pdfController.generateTransactionReceipt);

/**
 * @route   GET /api/pdf/transactions/export
 * @desc    Exporter la liste des transactions en PDF
 * @access  Private
 * @query   status, type, category_id, date_from, date_to, search, amount_min, amount_max
 */
router.get('/transactions/export', pdfController.exportTransactionsList);

/**
 * @route   GET /api/pdf/report/financial
 * @desc    Générer un rapport financier
 * @access  Private
 * @query   year, month, start_date, end_date
 */
router.get('/report/financial', pdfController.generateFinancialReport);

/**
 * @route   GET /api/pdf/members/:id/statement
 * @desc    Générer un relevé pour un membre
 * @access  Private
 */
router.get('/members/:id/statement', pdfController.generateMemberStatement);

/**
 * ✅ NOUVEAU : @route   GET /api/pdf/team-members/export
 * @desc    Exporter la liste des Team Members
 * @access  Private
 * @query   status, contribution_status
 */
router.get('/team-members/export', pdfController.exportTeamMembers);

/**
 * ✅ NOUVEAU : @route   GET /api/pdf/adherents/export
 * @desc    Exporter la liste des Adhérents
 * @access  Private
 * @query   status, subscription_status
 */
router.get('/adherents/export', pdfController.exportAdherents);

/**
 * ✅ NOUVEAU : @route   GET /api/pdf/contributions/team/export
 * @desc    Exporter les cotisations Team Members
 * @access  Private
 * @query   year, month, paid (yes/no)
 */
router.get('/contributions/team/export', pdfController.exportTeamContributions);

/**
 * ✅ NOUVEAU : @route   GET /api/pdf/contributions/adherents/export
 * @desc    Exporter les abonnements Adhérents
 * @access  Private
 * @query   year, month, paid (yes/no)
 */
router.get('/contributions/adherents/export', pdfController.exportAdherentContributions);

/**
 * @route   GET /api/pdf/check-assets
 * @desc    Vérifier l'état des assets PDF
 * @access  Private
 */
router.get('/check-assets', pdfController.checkPdfAssets);

module.exports = router;