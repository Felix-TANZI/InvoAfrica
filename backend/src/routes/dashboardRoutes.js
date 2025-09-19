const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, allRoles } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Récupérer les statistiques globales du dashboard
 * @access  Private (tous les rôles)
 * @query   year, month
 */
router.get('/stats', authenticateToken, allRoles, dashboardController.getDashboardStats);

/**
 * @route   GET /api/dashboard/recent-transactions
 * @desc    Récupérer les dernières transactions
 * @access  Private (tous les rôles)
 * @query   limit
 */
router.get('/recent-transactions', authenticateToken, allRoles, dashboardController.getRecentTransactions);

/**
 * @route   GET /api/dashboard/late-contributions
 * @desc    Récupérer les membres en retard de cotisation
 * @access  Private (tous les rôles)
 */
router.get('/late-contributions', authenticateToken, allRoles, dashboardController.getLateContributions);

module.exports = router;