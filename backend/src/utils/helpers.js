const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fonctions pour le hachage des mots de passe
const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('❌ Erreur lors du hachage:', error.message);
    throw new Error('Erreur lors du hachage du mot de passe');
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('❌ Erreur lors de la comparaison:', error.message);
    throw new Error('Erreur lors de la vérification du mot de passe');
  }
};

// Fonctions pour les tokens JWT
const generateToken = (userId, role) => {
  try {
    return jwt.sign(
      { 
        userId, 
        role,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'invoafrica-api',
      }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la génération du token:', error.message);
    throw new Error('Erreur lors de la génération du token');
  }
};

const generateRefreshToken = (userId) => {
  try {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d',
        issuer: 'invoafrica-api',
      }
    );
  } catch (error) {
    console.error('❌ Erreur lors de la génération du refresh token:', error.message);
    throw new Error('Erreur lors de la génération du refresh token');
  }
};

// Fonction pour générer une référence unique
const generateReference = (prefix, year = null, sequence = null) => {
  const currentYear = year || new Date().getFullYear();
  const seq = sequence || Math.floor(Math.random() * 9999) + 1;
  return `${prefix}-${currentYear}-${seq.toString().padStart(4, '0')}`;
};

// Fonction pour formater les montants en FCFA
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('XAF', 'FCFA');
};

// Fonction pour valider les emails
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction pour valider les mots de passe
const isValidPassword = (password) => {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Fonction pour valider les numéros de téléphone
const isValidPhone = (phone) => {
  // Format camerounais ou international
  const phoneRegex = /^(\+237|237)?[2368]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Fonction pour nettoyer les données d'entrée
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Fonction pour calculer l'âge d'une date
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Fonction pour calculer les jours de retard
const calculateLateDays = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Fonction pour générer un mot de passe temporaire
const generateTempPassword = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$';
  let password = '';
  
  // Assurer au moins un caractère de chaque type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@#$'[Math.floor(Math.random() * 3)];
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Fonction de réponse standardisée
const sendResponse = (res, status, message, data = null, meta = null) => {
  const response = {
    status: status >= 400 ? 'error' : 'success',
    message,
    ...(data && { data }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };
  
  return res.status(status).json(response);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  generateReference,
  formatAmount,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  sanitizeInput,
  calculateAge,
  calculateLateDays,
  generateTempPassword,
  sendResponse,
};