/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const express = require('express');
const router = express.Router();

// Import des middlewares
const { authenticateToken, adminOnly, allRoles } = require('../middleware/auth');
const { executeQuery } = require('../config/database');
const { sendResponse, hashPassword, isValidEmail, sanitizeInput } = require('../utils/helpers');


// ROUTES UTILISATEURS


/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs
 * @access  Private (admin seulement)
 */
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const users = await executeQuery(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    return sendResponse(res, 200, 'Utilisateurs récupérés avec succès', {
      users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Private (admin seulement)
 */
router.get('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID utilisateur invalide');
    }

    const users = await executeQuery(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    if (users.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    return sendResponse(res, 200, 'Utilisateur récupéré avec succès', {
      user: users[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (admin seulement)
 */
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID utilisateur invalide');
    }

    // Vérifier que l'utilisateur existe
    const existingUsers = await executeQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    // Validation des données
    if (!name || !email || !role) {
      return sendResponse(res, 400, 'Nom, email et rôle requis');
    }

    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email.toLowerCase());

    if (!isValidEmail(cleanEmail)) {
      return sendResponse(res, 400, 'Format d\'email invalide');
    }

    if (!['admin', 'tresorier', 'commissaire'].includes(role)) {
      return sendResponse(res, 400, 'Rôle invalide');
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    const emailCheck = await executeQuery(
      'SELECT id FROM users WHERE email = ? AND id != ?', 
      [cleanEmail, id]
    );

    if (emailCheck.length > 0) {
      return sendResponse(res, 409, 'Cet email est déjà utilisé');
    }

    // Mettre à jour l'utilisateur
    await executeQuery(`
      UPDATE users 
      SET name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [cleanName, cleanEmail, role, is_active ? 1 : 0, id]);

    // Récupérer l'utilisateur mis à jour
    const updatedUsers = await executeQuery(`
      SELECT id, name, email, role, is_active, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    return sendResponse(res, 200, 'Utilisateur modifié avec succès', {
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification de l\'utilisateur:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private (admin seulement)
 */
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID utilisateur invalide');
    }

    // Empêcher la suppression de son propre compte
    if (parseInt(id) === req.user.id) {
      return sendResponse(res, 400, 'Vous ne pouvez pas supprimer votre propre compte');
    }

    // Vérifier que l'utilisateur existe
    const existingUsers = await executeQuery('SELECT id, name FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);

    return sendResponse(res, 200, 'Utilisateur supprimé avec succès', {
      deletedUser: existingUsers[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
});

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Réinitialiser le mot de passe d'un utilisateur
 * @access  Private (admin seulement)
 */
router.post('/:id/reset-password', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID utilisateur invalide');
    }

    if (!newPassword) {
      return sendResponse(res, 400, 'Nouveau mot de passe requis');
    }

    // Vérifier que l'utilisateur existe
    const existingUsers = await executeQuery('SELECT id, name FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await executeQuery(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [hashedPassword, id]);

    return sendResponse(res, 200, 'Mot de passe réinitialisé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
});

module.exports = router;