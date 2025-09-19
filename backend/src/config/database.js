const mysql = require('mysql2');
require('dotenv').config();

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'felixtanzi12',
  database: process.env.DB_NAME || 'invoafrica_db',
  charset: 'utf8mb4',
};

// Création du pool de connexions
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Version promisifiée pour async/await
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Connexion à MySQL réussie');
    console.log(`📊 Base de données: ${dbConfig.database}`);
    console.log(`🌐 Serveur: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
    return false;
  }
};

// Fonction utilitaire pour exécuter des requêtes
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await promisePool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la requête:', error.message);
    throw error;
  }
};

// Fonction pour les transactions
const executeTransaction = async (queries) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur dans la transaction:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  promisePool,
  testConnection,
  executeQuery,
  executeTransaction,
  dbConfig,
};