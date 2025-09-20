/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const express = require('express');
const router = express.Router();

// Import des contrôleurs et middlewares
const authController = require('../controllers/authController');
const { authenticateToken, adminOnly } = require('../middleware/auth');


// ROUTES PUBLIQUES (sans authentification)


/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login);


// ROUTES PROTÉGÉES (avec authentification)


/**
 * @route   GET /api/auth/profile
 * @desc    Récupérer le profil utilisateur connecté
 * @access  Private (tous les rôles)
 * @headers Authorization: Bearer <token>
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Changer le mot de passe
 * @access  Private (tous les rôles)
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authenticateToken, authController.changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérifier la validité du token
 * @access  Private (tous les rôles)
 * @headers Authorization: Bearer <token>
 */
router.get('/verify', authenticateToken, authController.verifyToken);


// ROUTES ADMIN SEULEMENT


/**
 * @route   POST /api/auth/register
 * @desc    Créer un nouvel utilisateur
 * @access  Private (admin seulement)
 * @headers Authorization: Bearer <token>
 * @body    { name, email, password, role }
 */
router.post('/register', authenticateToken, adminOnly, authController.register);

module.exports = router;