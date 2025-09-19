const { executeQuery } = require('../config/database');
const { sanitizeInput, sendResponse } = require('../utils/helpers');

// Récupérer toutes les catégories
const getCategories = async (req, res) => {
  try {
    const { type, active_only = 'true' } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    if (type && ['recette', 'depense'].includes(type)) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    if (active_only === 'true') {
      whereConditions.push('is_active = true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const categories = await executeQuery(`
      SELECT id, name, type, description, is_active, created_at
      FROM categories 
      ${whereClause}
      ORDER BY type, name
    `, queryParams);

    return sendResponse(res, 200, 'Catégories récupérées avec succès', {
      categories,
      count: categories.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Créer une nouvelle catégorie (admin seulement)
const createCategory = async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return sendResponse(res, 400, 'Nom et type requis');
    }

    if (!['recette', 'depense'].includes(type)) {
      return sendResponse(res, 400, 'Type invalide');
    }

    const cleanName = sanitizeInput(name);
    const cleanDescription = description ? sanitizeInput(description) : null;

    // Vérifier si la catégorie existe déjà
    const existing = await executeQuery(
      'SELECT id FROM categories WHERE name = ? AND type = ?',
      [cleanName, type]
    );

    if (existing.length > 0) {
      return sendResponse(res, 409, 'Une catégorie avec ce nom existe déjà pour ce type');
    }

    const result = await executeQuery(
      'INSERT INTO categories (name, type, description) VALUES (?, ?, ?)',
      [cleanName, type, cleanDescription]
    );

    const newCategory = await executeQuery(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    return sendResponse(res, 201, 'Catégorie créée avec succès', {
      category: newCategory[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la catégorie:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  getCategories,
  createCategory,
};