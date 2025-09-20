/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const { executeQuery } = require('../config/database');
const { 
  hashPassword, 
  comparePassword, 
  generateToken,
  isValidEmail,
  isValidPassword,
  sanitizeInput,
  sendResponse 
} = require('../utils/helpers');

// Connexion utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données d'entrée
    if (!email || !password) {
      return sendResponse(res, 400, 'Email et mot de passe requis');
    }

    // Nettoyer l'email
    const cleanEmail = sanitizeInput(email.toLowerCase());

    if (!isValidEmail(cleanEmail)) {
      return sendResponse(res, 400, 'Format d\'email invalide');
    }

    // Rechercher l'utilisateur dans la base de données
    const users = await executeQuery(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return sendResponse(res, 401, 'Email ou mot de passe incorrect');
    }

    const user = users[0];

    // Vérifier si l'utilisateur est actif
    if (!user.is_active) {
      return sendResponse(res, 403, 'Compte désactivé. Contactez l\'administrateur');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return sendResponse(res, 401, 'Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const token = generateToken(user.id, user.role);

    // Mettre à jour la dernière connexion (optionnel)
    await executeQuery(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Préparer les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Envoyer la réponse avec le token
    return sendResponse(res, 200, 'Connexion réussie', {
      user: userData,
      token,
      expiresIn: '24h',
    });

  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Création d'un nouvel utilisateur (admin seulement)
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation des données d'entrée
    if (!name || !email || !password || !role) {
      return sendResponse(res, 400, 'Tous les champs sont requis');
    }

    // Nettoyer les données
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email.toLowerCase());

    // Validations
    if (!isValidEmail(cleanEmail)) {
      return sendResponse(res, 400, 'Format d\'email invalide');
    }

    if (!isValidPassword(password)) {
      return sendResponse(res, 400, 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    if (!['admin', 'tresorier', 'commissaire'].includes(role)) {
      return sendResponse(res, 400, 'Rôle invalide');
    }

    // Vérifier si l'email existe déjà
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return sendResponse(res, 409, 'Un utilisateur avec cet email existe déjà');
    }

    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Insérer le nouvel utilisateur
    const result = await executeQuery(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [cleanName, cleanEmail, hashedPassword, role]
    );

    // Récupérer l'utilisateur créé
    const newUser = await executeQuery(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    return sendResponse(res, 201, 'Utilisateur créé avec succès', {
      user: newUser[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création d\'utilisateur:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupération des informations utilisateur connecté
const getProfile = async (req, res) => {
  try {
    // L'utilisateur est déjà disponible via le middleware auth
    const userId = req.user.id;

    // Récupérer les informations complètes
    const users = await executeQuery(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    return sendResponse(res, 200, 'Profil récupéré avec succès', {
      user: users[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Changement de mot de passe
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return sendResponse(res, 400, 'Mot de passe actuel et nouveau mot de passe requis');
    }

    if (!isValidPassword(newPassword)) {
      return sendResponse(res, 400, 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Récupérer l'utilisateur
    const users = await executeQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return sendResponse(res, 404, 'Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await comparePassword(currentPassword, users[0].password_hash);

    if (!isCurrentPasswordValid) {
      return sendResponse(res, 400, 'Mot de passe actuel incorrect');
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );

    return sendResponse(res, 200, 'Mot de passe modifié avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Vérification de la validité du token
const verifyToken = async (req, res) => {
  try {
    // Si nous arrivons ici, c'est que le token est valide (vérifié par le middleware)
    return sendResponse(res, 200, 'Token valide', {
      user: req.user,
      valid: true
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  verifyToken,
};