/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { authenticateToken, adminOnly, allRoles } = require('../middleware/auth');

/**
 * @route   GET /api/categories
 * @desc    Récupérer toutes les catégories
 * @access  Private (tous les rôles)
 * @query   type (recette/depense), active_only (true/false)
 */
router.get('/', authenticateToken, allRoles, categoryController.getCategories);

/**
 * @route   POST /api/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (admin seulement)
 */
router.post('/', authenticateToken, adminOnly, categoryController.createCategory);

module.exports = router;