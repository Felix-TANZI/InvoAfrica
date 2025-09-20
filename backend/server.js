/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import de la configuration de base de données
const { testConnection } = require('./src/config/database');
// Import du scheduler automatique
const { startScheduler } = require('./src/utils/scheduler');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;


// MIDDLEWARES DE SÉCURITÉ


// Helmet pour la sécurité des headers HTTP
app.use(helmet());

// Configuration CORS pour permettre les requêtes depuis le frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting - limite le nombre de requêtes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);


// MIDDLEWARES POUR PARSING


// Parser pour JSON (limite à 10mb)
app.use(express.json({ limit: '10mb' }));

// Parser pour URL encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));


// ROUTES


// Route de santé pour vérifier que l'API fonctionne
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'InvoAfrica API est opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Route de base
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bienvenue sur l\'API InvoAfrica',
    documentation: '/api/docs',
    health: '/health',
  });
});

// Import et utilisation des routes API
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/contributions', require('./src/routes/contributionRoutes'));
app.use('/api/members', require('./src/routes/memberRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
// app.use('/api/reports', require('./src/routes/reportRoutes'));


// GESTION DES ERREURS


// Middleware pour les routes non trouvées
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} non trouvée`,
  });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  
  // Erreur de validation JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Format JSON invalide',
    });
  }
  
  // Erreur de base de données
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion à la base de données',
    });
  }
  
  // Erreur générique
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
  });
});


// DÉMARRAGE DU SERVEUR


const startServer = async () => {
  try {
    // Test de la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      console.error('Vérifiez votre fichier .env et votre serveur MySQL');
      process.exit(1);
    }
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log('\n🚀 =======================================');
      console.log('   INVOAFRICA API DÉMARRÉE');
      console.log('🚀 =======================================');
      console.log(`🌐 Serveur: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de données: ${process.env.DB_NAME}`);
      console.log('========================================\n');
      
      // Démarrer le scheduler automatique des cotisations
      startScheduler();
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});

// Démarrage
startServer();

module.exports = app;