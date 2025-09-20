/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const express = require('express');
const router = express.Router();

const memberController = require('../controllers/memberController');
const { authenticateToken, adminOnly, allRoles } = require('../middleware/auth');


// TEAM MEMBERS (Membres du Bureau)


/**
 * @route   GET /api/members/team
 * @desc    Récupérer tous les team members
 * @access  Private (tous les rôles)
 * @query   active_only (true/false)
 */
router.get('/team', authenticateToken, allRoles, memberController.getTeamMembers);

/**
 * @route   POST /api/members/team
 * @desc    Créer un team member
 * @access  Private (admin seulement)
 * @body    { name, email, phone, position, registration_date, notes }
 */
router.post('/team', authenticateToken, adminOnly, memberController.createTeamMember);

/**
 * @route   PUT /api/members/team/:id
 * @desc    Modifier un team member
 * @access  Private (admin seulement)
 * @body    { name, email, phone, position, is_active, penalty_amount, notes }
 */
router.put('/team/:id', authenticateToken, adminOnly, memberController.updateTeamMember);


// ADHERENTS


/**
 * @route   GET /api/members/adherents
 * @desc    Récupérer tous les adhérents
 * @access  Private (tous les rôles)
 * @query   active_only (true/false)
 */
router.get('/adherents', authenticateToken, allRoles, memberController.getAdherents);

/**
 * @route   POST /api/members/adherents
 * @desc    Créer un adhérent
 * @access  Private (admin seulement)
 * @body    { name, email, phone, registration_date, notes }
 */
router.post('/adherents', authenticateToken, adminOnly, memberController.createAdherent);

/**
 * @route   PUT /api/members/adherents/:id
 * @desc    Modifier un adhérent
 * @access  Private (admin seulement)
 * @body    { name, email, phone, is_active, penalty_amount, notes }
 */
router.put('/adherents/:id', authenticateToken, adminOnly, memberController.updateAdherent);

module.exports = router;