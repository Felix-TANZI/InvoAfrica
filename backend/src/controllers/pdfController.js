/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 2.0 - PDF Controller CORRIGÉ

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const PDFService = require('../services/pdfService');
const { executeQuery } = require('../config/database');
const { sendResponse } = require('../utils/helpers');

/**
 * Générer un reçu pour une transaction
 */
const generateTransactionReceipt = async (req, res) => {
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
    
    const transaction = transactions[0];
    
    const doc = await PDFService.generateReceipt(transaction);
    const pdfBuffer = await PDFService.toBuffer(doc);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Recu_${transaction.reference}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('✅ Reçu généré pour:', transaction.reference);
    
  } catch (error) {
    console.error('❌ Erreur génération reçu:', error);
    return sendResponse(res, 500, 'Erreur lors de la génération du reçu');
  }
};

/**
 * Exporter une liste de transactions en PDF
 */
const exportTransactionsList = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      category_id, 
      date_from,   
      date_to,     
      search,
      amount_min,
      amount_max
    } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (status && ['en_attente', 'validee', 'annulee'].includes(status)) {
      whereConditions.push('t.status = ?');
      queryParams.push(status);
    }
    
    if (type && ['recette', 'depense'].includes(type)) {
      whereConditions.push('t.type = ?');
      queryParams.push(type);
    }
    
    if (category_id && !isNaN(category_id)) {
      whereConditions.push('t.category_id = ?');
      queryParams.push(parseInt(category_id));
    }
    
    if (date_from) {
      whereConditions.push('t.transaction_date >= ?');
      queryParams.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('t.transaction_date <= ?');
      queryParams.push(date_to);
    }
    
    if (amount_min && !isNaN(amount_min)) {
      whereConditions.push('t.amount >= ?');
      queryParams.push(parseFloat(amount_min));
    }
    
    if (amount_max && !isNaN(amount_max)) {
      whereConditions.push('t.amount <= ?');
      queryParams.push(parseFloat(amount_max));
    }
    
    if (search && search.trim() !== '') {
      whereConditions.push('(t.description LIKE ? OR t.contact_person LIKE ? OR t.reference LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Récupérer les transactions
    const transactions = await executeQuery(`
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
        c.name as category_name,
        c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.transaction_date DESC
      LIMIT 1000
    `, queryParams);

    // ✅ CORRECTION : Créer nouvelle variable au lieu de réassigner
    const transactionsWithMembers = transactions.map(t => {
      let memberName = '';
      
      // Pour cotisations/adhésions, extraire le nom après " - "
      if ((t.category_name === 'Cotisations' || t.category_name === 'Adhésions') && t.description) {
        const parts = t.description.split(' - ');
        if (parts.length > 1) {
          memberName = parts[1].trim();
        }
      } else if (t.contact_person) {
        // Sinon utiliser contact_person
        memberName = t.contact_person.trim();
      }
      
      return { ...t, member_name: memberName };
    });
    
    // Calculer les statistiques
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.type = 'recette' AND t.status = 'validee' THEN t.amount ELSE 0 END) as montant_recettes,
        SUM(CASE WHEN t.type = 'depense' AND t.status = 'validee' THEN t.amount ELSE 0 END) as montant_depenses
      FROM transactions t
      ${whereClause}
    `;
    
    const statsResult = await executeQuery(statsQuery, queryParams);
    const stats = statsResult[0] || {};
    stats.solde = (parseFloat(stats.montant_recettes) || 0) - (parseFloat(stats.montant_depenses) || 0);
    
    // Générer le PDF avec les transactions enrichies
    const filters = { status, type, category_id, date_from, date_to, search, amount_min, amount_max };
    const doc = await PDFService.generateTransactionList(transactionsWithMembers, filters, stats);
    const pdfBuffer = await PDFService.toBuffer(doc);
    
    const filename = `Transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('✅ Liste exportée:', transactionsWithMembers.length, 'transactions');
    
  } catch (error) {
    console.error('❌ Erreur export liste:', error);
    return sendResponse(res, 500, 'Erreur lors de l\'export');
  }
};

/**
 * Générer un rapport financier
 */
const generateFinancialReport = async (req, res) => {
  try {
    const { year, month, start_date, end_date } = req.query;
    
    let dateFilter = '';
    let params = [];
    let period = '';
    
    if (start_date && end_date) {
      dateFilter = 'WHERE t.transaction_date BETWEEN ? AND ?';
      params = [start_date, end_date];
      period = `${start_date} au ${end_date}`;
    } else if (year && month) {
      dateFilter = 'WHERE YEAR(t.transaction_date) = ? AND MONTH(t.transaction_date) = ?';
      params = [parseInt(year), parseInt(month)];
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      period = `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (year) {
      dateFilter = 'WHERE YEAR(t.transaction_date) = ?';
      params = [parseInt(year)];
      period = `Année ${year}`;
    } else {
      period = 'Toute la période';
    }
    
    const statsQuery = `
      SELECT 
        SUM(CASE WHEN t.type = 'recette' AND t.status = 'validee' THEN t.amount ELSE 0 END) as total_recettes,
        SUM(CASE WHEN t.type = 'depense' AND t.status = 'validee' THEN t.amount ELSE 0 END) as total_depenses
      FROM transactions t
      ${dateFilter}
    `;
    
    const statsResult = await executeQuery(statsQuery, params);
    
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
      HAVING transaction_count > 0
      ORDER BY total_amount DESC
    `;
    
    const categoryStats = await executeQuery(categoryStatsQuery, params);
    
    const reportData = {
      period,
      totalRecettes: statsResult[0].total_recettes || 0,
      totalDepenses: statsResult[0].total_depenses || 0,
      byCategory: categoryStats
    };
    
    const doc = await PDFService.generateFinancialReport(reportData);
    const pdfBuffer = await PDFService.toBuffer(doc);
    
    const filename = `Rapport_Financier_${period.replace(/\s/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('✅ Rapport généré pour:', period);
    
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return sendResponse(res, 500, 'Erreur lors de la génération du rapport');
  }
};

/**
 * Générer un relevé pour un membre
 */
const generateMemberStatement = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID de membre invalide');
    }
    
    const members = await executeQuery(
      'SELECT * FROM members WHERE id = ?',
      [parseInt(id)]
    );
    
    if (members.length === 0) {
      return sendResponse(res, 404, 'Membre non trouvé');
    }
    
    const member = members[0];
    
    const contributions = await executeQuery(`
      SELECT 
        c.*,
        ct.name as type_name
      FROM contributions c
      LEFT JOIN contribution_types ct ON c.type_id = ct.id
      WHERE c.member_id = ?
      ORDER BY c.due_date DESC
    `, [parseInt(id)]);
    
    const doc = await PDFService.generateMemberStatement(member, contributions);
    const pdfBuffer = await PDFService.toBuffer(doc);
    
    const filename = `Releve_${member.name.replace(/\s/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
    console.log('✅ Relevé généré pour:', member.name);
    
  } catch (error) {
    console.error('❌ Erreur génération relevé:', error);
    return sendResponse(res, 500, 'Erreur lors de la génération du relevé');
  }
};

/**
 * Vérifier l'état des assets PDF
 */
const checkPdfAssets = async (req, res) => {
  try {
    const assets = PDFService.checkAssets();
    
    return sendResponse(res, 200, 'État des assets PDF', {
      assets,
      allReady: assets.logo && assets.signature
    });
  } catch (error) {
    console.error('❌ Erreur vérification assets:', error);
    return sendResponse(res, 500, 'Erreur lors de la vérification');
  }
};

module.exports = {
  generateTransactionReceipt,
  exportTransactionsList,
  generateFinancialReport,
  generateMemberStatement,
  checkPdfAssets
};