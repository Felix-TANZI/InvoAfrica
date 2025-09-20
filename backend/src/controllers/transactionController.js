/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */


const { executeQuery, executeTransaction } = require('../config/database');
const { 
  generateReference, 
  sanitizeInput, 
  sendResponse 
} = require('../utils/helpers');

// Récupérer toutes les transactions avec pagination et filtres
const getTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      category_id, 
      date_from, 
      date_to,
      search 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereConditions = [];
    let queryParams = [];

    // Construction dynamique des filtres avec gestion propre des types
    if (status && ['en_attente', 'validee', 'annulee'].includes(status)) {
      whereConditions.push('t.status = ?');
      queryParams.push(status);
    }

    if (type && ['recette', 'depense'].includes(type)) {
      whereConditions.push('t.type = ?');
      queryParams.push(type);
    }

    if (category_id && !isNaN(category_id) && category_id !== '') {
      whereConditions.push('t.category_id = ?');
      queryParams.push(parseInt(category_id));
    }

    if (date_from && date_from !== '') {
      whereConditions.push('t.transaction_date >= ?');
      queryParams.push(date_from);
    }

    if (date_to && date_to !== '') {
      whereConditions.push('t.transaction_date <= ?');
      queryParams.push(date_to);
    }

    if (search && search.trim() !== '') {
      whereConditions.push('(t.description LIKE ? OR t.contact_person LIKE ? OR t.reference LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Requête principale avec jointures - LIMIT et OFFSET directement dans la chaîne
    const transactionsQuery = `
      SELECT 
        t.id,
        t.reference,
        t.category_id,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        t.payment_mode,
        t.status,
        t.contact_person,
        t.notes,
        t.created_at,
        t.updated_at,
        c.name as category_name,
        c.type as category_type,
        creator.name as created_by_name,
        validator.name as validated_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users validator ON t.validated_by = validator.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Requête pour le count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;

    console.log('🔍 Query transactions:', transactionsQuery);
    console.log('📊 Params transactions:', queryParams);
    console.log('🔍 Query count:', countQuery);
    console.log('📊 Params count:', queryParams);

    // Exécution des requêtes - même paramètres pour les deux requêtes
    const [transactions, countResult] = await Promise.all([
      executeQuery(transactionsQuery, queryParams),
      executeQuery(countQuery, queryParams)
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    return sendResponse(res, 200, 'Transactions récupérées avec succès', {
      transactions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des transactions:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer une transaction par ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID de transaction invalide');
    }

    const transactions = await executeQuery(`
      SELECT 
        t.*,
        c.name as category_name,
        c.type as category_type,
        creator.name as created_by_name,
        validator.name as validated_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users validator ON t.validated_by = validator.id
      WHERE t.id = ?
    `, [parseInt(id)]);

    if (transactions.length === 0) {
      return sendResponse(res, 404, 'Transaction non trouvée');
    }

    return sendResponse(res, 200, 'Transaction récupérée avec succès', {
      transaction: transactions[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la transaction:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Créer une nouvelle transaction
const createTransaction = async (req, res) => {
  try {
    const {
      category_id,
      amount,
      type,
      description,
      transaction_date,
      payment_mode,
      contact_person,
      notes
    } = req.body;

    // Validation des données obligatoires
    if (!category_id || !amount || !type || !description || !transaction_date || !payment_mode) {
      return sendResponse(res, 400, 'Tous les champs obligatoires doivent être remplis');
    }

    // Validation des types
    if (!['recette', 'depense'].includes(type)) {
      return sendResponse(res, 400, 'Type de transaction invalide');
    }

    if (!['cash', 'om', 'momo', 'virement', 'cheque'].includes(payment_mode)) {
      return sendResponse(res, 400, 'Mode de paiement invalide');
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return sendResponse(res, 400, 'Le montant doit être un nombre positif');
    }

    if (isNaN(category_id)) {
      return sendResponse(res, 400, 'ID de catégorie invalide');
    }

    // Vérifier que la catégorie existe et correspond au type
    const categories = await executeQuery(
      'SELECT id, type FROM categories WHERE id = ? AND is_active = 1',
      [parseInt(category_id)]
    );

    if (categories.length === 0) {
      return sendResponse(res, 400, 'Catégorie non trouvée ou inactive');
    }

    if (categories[0].type !== type) {
      return sendResponse(res, 400, `Cette catégorie est pour les ${categories[0].type}s, pas les ${type}s`);
    }

    // Générer une référence unique
    const reference = generateReference('TRX', new Date(transaction_date).getFullYear());

    // Vérifier l'unicité de la référence
    let uniqueReference = reference;
    let counter = 1;
    while (true) {
      const existing = await executeQuery('SELECT id FROM transactions WHERE reference = ?', [uniqueReference]);
      if (existing.length === 0) break;
      uniqueReference = `${reference}-${counter}`;
      counter++;
    }

    // Nettoyer les données
    const cleanDescription = sanitizeInput(description);
    const cleanContactPerson = contact_person ? sanitizeInput(contact_person) : null;
    const cleanNotes = notes ? sanitizeInput(notes) : null;

    // Insérer la transaction
    const result = await executeQuery(`
      INSERT INTO transactions (
        reference, category_id, amount, type, description, 
        transaction_date, payment_mode, contact_person, 
        notes, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `, [
      uniqueReference, 
      parseInt(category_id), 
      parseFloat(amount), 
      type, 
      cleanDescription, 
      transaction_date, 
      payment_mode, 
      cleanContactPerson, 
      cleanNotes, 
      parseInt(req.user.id)
    ]);

    // Récupérer la transaction créée
    const newTransaction = await executeQuery(`
      SELECT 
        t.*,
        c.name as category_name,
        creator.name as created_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `, [result.insertId]);

    return sendResponse(res, 201, 'Transaction créée avec succès', {
      transaction: newTransaction[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la transaction:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Modifier une transaction (seulement si en_attente)
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      amount,
      type,
      description,
      transaction_date,
      payment_mode,
      contact_person,
      notes
    } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID de transaction invalide');
    }

    // Vérifier que la transaction existe
    const existingTransactions = await executeQuery(
      'SELECT id, status, created_by FROM transactions WHERE id = ?',
      [parseInt(id)]
    );

    if (existingTransactions.length === 0) {
      return sendResponse(res, 404, 'Transaction non trouvée');
    }

    const transaction = existingTransactions[0];

    // Seules les transactions en attente peuvent être modifiées
    if (transaction.status !== 'en_attente') {
      return sendResponse(res, 400, 'Seules les transactions en attente peuvent être modifiées');
    }

    // Seul le créateur ou un admin peut modifier
    if (transaction.created_by !== req.user.id && req.user.role !== 'admin') {
      return sendResponse(res, 403, 'Vous n\'êtes pas autorisé à modifier cette transaction');
    }

    // Construire la requête de mise à jour dynamiquement
    let updateFields = [];
    let updateParams = [];

    if (category_id) {
      updateFields.push('category_id = ?');
      updateParams.push(parseInt(category_id));
    }
    if (amount) {
      updateFields.push('amount = ?');
      updateParams.push(parseFloat(amount));
    }
    if (type) {
      updateFields.push('type = ?');
      updateParams.push(type);
    }
    if (description) {
      updateFields.push('description = ?');
      updateParams.push(sanitizeInput(description));
    }
    if (transaction_date) {
      updateFields.push('transaction_date = ?');
      updateParams.push(transaction_date);
    }
    if (payment_mode) {
      updateFields.push('payment_mode = ?');
      updateParams.push(payment_mode);
    }
    if (contact_person !== undefined) {
      updateFields.push('contact_person = ?');
      updateParams.push(contact_person ? sanitizeInput(contact_person) : null);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes ? sanitizeInput(notes) : null);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, 400, 'Aucune donnée à mettre à jour');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(parseInt(id));

    // Exécuter la mise à jour
    await executeQuery(`
      UPDATE transactions 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateParams);

    // Récupérer la transaction mise à jour
    const updatedTransaction = await executeQuery(`
      SELECT 
        t.*,
        c.name as category_name,
        creator.name as created_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `, [parseInt(id)]);

    return sendResponse(res, 200, 'Transaction modifiée avec succès', {
      transaction: updatedTransaction[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification de la transaction:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Valider une transaction (admin seulement)
const validateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID de transaction invalide');
    }

    // Vérifier que la transaction existe
    const existingTransactions = await executeQuery(
      'SELECT id, status FROM transactions WHERE id = ?',
      [parseInt(id)]
    );

    if (existingTransactions.length === 0) {
      return sendResponse(res, 404, 'Transaction non trouvée');
    }

    const transaction = existingTransactions[0];

    if (transaction.status !== 'en_attente') {
      return sendResponse(res, 400, 'Cette transaction n\'est pas en attente de validation');
    }

    // Valider la transaction
    await executeQuery(`
      UPDATE transactions 
      SET status = 'validee', validated_by = ?, validated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [parseInt(req.user.id), parseInt(id)]);

    // Récupérer la transaction validée
    const validatedTransaction = await executeQuery(`
      SELECT 
        t.*,
        c.name as category_name,
        creator.name as created_by_name,
        validator.name as validated_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users validator ON t.validated_by = validator.id
      WHERE t.id = ?
    `, [parseInt(id)]);

    return sendResponse(res, 200, 'Transaction validée avec succès', {
      transaction: validatedTransaction[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la validation de la transaction:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Annuler une transaction
const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID de transaction invalide');
    }

    // Vérifier que la transaction existe
    const existingTransactions = await executeQuery(
      'SELECT id, status FROM transactions WHERE id = ?',
      [parseInt(id)]
    );

    if (existingTransactions.length === 0) {
      return sendResponse(res, 404, 'Transaction non trouvée');
    }

    const transaction = existingTransactions[0];

    if (transaction.status === 'annulee') {
      return sendResponse(res, 400, 'Cette transaction est déjà annulée');
    }

    if (transaction.status === 'validee' && req.user.role !== 'admin') {
      return sendResponse(res, 403, 'Seul l\'administrateur peut annuler une transaction validée');
    }

    // Annuler la transaction
    const cancelNote = reason ? `Annulée: ${sanitizeInput(reason)}` : 'Transaction annulée';
    
    await executeQuery(`
      UPDATE transactions 
      SET status = 'annulee', notes = CONCAT(IFNULL(notes, ''), '\n', ?), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cancelNote, parseInt(id)]);

    return sendResponse(res, 200, 'Transaction annulée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de l\'annulation de la transaction:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Statistiques des transactions
const getTransactionStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    let dateFilter = '';
    let params = [];

    if (year) {
      if (month) {
        dateFilter = 'WHERE YEAR(transaction_date) = ? AND MONTH(transaction_date) = ?';
        params = [parseInt(year), parseInt(month)];
      } else {
        dateFilter = 'WHERE YEAR(transaction_date) = ?';
        params = [parseInt(year)];
      }
    }

    // Statistiques générales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'recette' AND status = 'validee' THEN amount ELSE 0 END) as total_recettes,
        SUM(CASE WHEN type = 'depense' AND status = 'validee' THEN amount ELSE 0 END) as total_depenses,
        SUM(CASE WHEN status = 'en_attente' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'validee' THEN 1 ELSE 0 END) as validated_count,
        SUM(CASE WHEN status = 'annulee' THEN 1 ELSE 0 END) as cancelled_count
      FROM transactions 
      ${dateFilter}
    `;

    const stats = await executeQuery(statsQuery, params);

    // Statistiques par catégorie
    const categoryStatsQuery = `
      SELECT 
        c.name as category_name,
        c.type as category_type,
        COUNT(t.id) as transaction_count,
        SUM(CASE WHEN t.status = 'validee' THEN t.amount ELSE 0 END) as total_amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id ${dateFilter ? 'AND ' + dateFilter.substring(6) : ''}
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.type
      ORDER BY total_amount DESC
    `;

    const categoryStats = await executeQuery(categoryStatsQuery, params);

    const soldeActuel = (stats[0].total_recettes || 0) - (stats[0].total_depenses || 0);

    return sendResponse(res, 200, 'Statistiques récupérées avec succès', {
      general: {
        ...stats[0],
        solde_actuel: soldeActuel
      },
      by_category: categoryStats
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  validateTransaction,
  cancelTransaction,
  getTransactionStats,
};