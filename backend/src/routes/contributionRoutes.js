const express = require('express');
const router = express.Router();

const contributionController = require('../controllers/contributionController');
const { authenticateToken, adminOnly, allRoles } = require('../middleware/auth');

// =====================================================
// GÉNÉRATION DES COTISATIONS
// =====================================================

/**
 * @route   POST /api/contributions/generate/team
 * @desc    Générer cotisations team members pour un mois
 * @access  Private (admin seulement)
 * @body    { month, year }
 */
router.post('/generate/team', authenticateToken, adminOnly, contributionController.generateTeamContributions);

/**
 * @route   POST /api/contributions/generate/adherents
 * @desc    Générer abonnements adhérents pour un mois
 * @access  Private (admin seulement)
 * @body    { month, year }
 */
router.post('/generate/adherents', authenticateToken, adminOnly, contributionController.generateAdherentContributions);

/**
 * @route   POST /api/contributions/generate/current
 * @desc    Générer toutes les cotisations du mois courant
 * @access  Private (admin seulement)
 */
router.post('/generate/current', authenticateToken, adminOnly, contributionController.generateCurrentMonthContributions);

// =====================================================
// GESTION DES PAIEMENTS
// =====================================================

/**
 * @route   PUT /api/contributions/team/:id/pay
 * @desc    Marquer cotisation team member comme payée
 * @access  Private (tous les rôles)
 * @body    { payment_date, payment_mode, notes }
 */
router.put('/team/:id/pay', authenticateToken, allRoles, contributionController.markTeamContributionPaid);

/**
 * @route   PUT /api/contributions/adherents/:id/pay
 * @desc    Marquer abonnement adhérent comme payé
 * @access  Private (tous les rôles)
 * @body    { payment_date, payment_mode, notes }
 */
router.put('/adherents/:id/pay', authenticateToken, allRoles, contributionController.markAdherentContributionPaid);

// =====================================================
// RÉCUPÉRATION DES DONNÉES
// =====================================================

/**
 * @route   GET /api/contributions/team
 * @desc    Récupérer cotisations team members
 * @access  Private (tous les rôles)
 * @query   year, month
 */
router.get('/team', authenticateToken, allRoles, contributionController.getTeamContributions);

/**
 * @route   GET /api/contributions/adherents
 * @desc    Récupérer abonnements adhérents
 * @access  Private (tous les rôles)
 * @query   year, month
 */
router.get('/adherents', authenticateToken, allRoles, contributionController.getAdherentContributions);

module.exports = router;