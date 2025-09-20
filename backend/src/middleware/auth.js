/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token d\'accès requis',
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les informations utilisateur depuis la base de données
    const user = await executeQuery(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ? AND is_active = true',
      [decoded.userId]
    );

    if (user.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non trouvé ou inactif',
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = user[0];
    next();

  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token invalide',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expiré',
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification du token',
    });
  }
};

// Middleware pour vérifier les rôles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentification requise',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé pour votre rôle',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware spécifique pour les admins seulement
const adminOnly = authorizeRoles('admin');

// Middleware pour admin et trésorier
const adminOrTresorier = authorizeRoles('admin', 'tresorier');

// Middleware pour tous les rôles connectés
const allRoles = authorizeRoles('admin', 'tresorier', 'commissaire');

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  adminOrTresorier,
  allRoles,
};