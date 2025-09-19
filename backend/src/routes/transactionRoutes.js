const express = require('express');
const router = express.Router();

// Import des contrôleurs et middlewares
const transactionController = require('../controllers/transactionController');
const { authenticateToken, adminOnly, allRoles } = require('../middleware/auth');

// =====================================================
// ROUTES TRANSACTIONS
// =====================================================

/**
 * @route   GET /api/transactions
 * @desc    Récupérer toutes les transactions avec filtres
 * @access  Private (tous les rôles)
 * @query   page, limit, status, type, category_id, date_from, date_to, search
 */
router.get('/', authenticateToken, allRoles, transactionController.getTransactions);

/**
 * @route   GET /api/transactions/stats
 * @desc    Statistiques des transactions
 * @access  Private (tous les rôles)
 * @query   year, month
 */
router.get('/stats', authenticateToken, allRoles, transactionController.getTransactionStats);

/**
 * @route   GET /api/transactions/:id
 * @desc    Récupérer une transaction par ID
 * @access  Private (tous les rôles)
 */
router.get('/:id', authenticateToken, allRoles, transactionController.getTransactionById);

/**
 * @route   POST /api/transactions
 * @desc    Créer une nouvelle transaction
 * @access  Private (tous les rôles)
 * @body    { category_id, amount, type, description, transaction_date, payment_mode, contact_person, notes }
 */
router.post('/', authenticateToken, allRoles, transactionController.createTransaction);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Modifier une transaction (seulement si en_attente)
 * @access  Private (tous les rôles - propriétaire ou admin)
 */
router.put('/:id', authenticateToken, allRoles, transactionController.updateTransaction);

/**
 * @route   POST /api/transactions/:id/validate
 * @desc    Valider une transaction
 * @access  Private (admin seulement)
 */
router.post('/:id/validate', authenticateToken, adminOnly, transactionController.validateTransaction);

/**
 * @route   POST /api/transactions/:id/cancel
 * @desc    Annuler une transaction
 * @access  Private (tous les rôles pour en_attente, admin pour validée)
 * @body    { reason }
 */
router.post('/:id/cancel', authenticateToken, allRoles, transactionController.cancelTransaction);

module.exports = router;