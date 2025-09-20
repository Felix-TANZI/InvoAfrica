/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const { executeQuery, executeTransaction } = require('../config/database');
const { sendResponse, calculateLateDays } = require('../utils/helpers');

// Montants par défaut
const DEFAULT_TEAM_CONTRIBUTION = 2000;
const DEFAULT_ADHERENT_CONTRIBUTION = 500;

// =====================================================
// GÉNÉRATION AUTOMATIQUE DES COTISATIONS
// =====================================================

// Générer les cotisations team members pour un mois donné
const generateTeamContributions = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return sendResponse(res, 400, 'Mois et année requis');
    }

    const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;

    // Vérifier si les cotisations existent déjà pour ce mois
    const existing = await executeQuery(
      'SELECT COUNT(*) as count FROM team_member_contributions WHERE month_year = ?',
      [monthYear]
    );

    if (existing[0].count > 0) {
      return sendResponse(res, 409, 'Les cotisations pour ce mois existent déjà');
    }

    // Récupérer tous les team members actifs
    const activeMembers = await executeQuery(
      'SELECT id, name FROM team_members WHERE is_active = true'
    );

    if (activeMembers.length === 0) {
      return sendResponse(res, 400, 'Aucun membre du bureau actif trouvé');
    }

    // Préparer les insertions
    const insertQueries = activeMembers.map(member => ({
      query: `INSERT INTO team_member_contributions 
              (team_member_id, month_year, amount, amount_paid, penalty_amount, status) 
              VALUES (?, ?, ?, 0, 0, 'en_attente')`,
      params: [member.id, monthYear, DEFAULT_TEAM_CONTRIBUTION]
    }));

    // Exécuter en transaction
    await executeTransaction(insertQueries);

    return sendResponse(res, 201, `Cotisations générées pour ${activeMembers.length} membres du bureau`, {
      month_year: monthYear,
      members_count: activeMembers.length,
      total_expected: activeMembers.length * DEFAULT_TEAM_CONTRIBUTION
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération des cotisations team:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Générer les abonnements adhérents pour un mois donné
const generateAdherentContributions = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return sendResponse(res, 400, 'Mois et année requis');
    }

    const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;

    // Vérifier si les abonnements existent déjà pour ce mois
    const existing = await executeQuery(
      'SELECT COUNT(*) as count FROM adherent_contributions WHERE month_year = ?',
      [monthYear]
    );

    if (existing[0].count > 0) {
      return sendResponse(res, 409, 'Les abonnements pour ce mois existent déjà');
    }

    // Récupérer tous les adhérents actifs
    const activeAdherents = await executeQuery(
      'SELECT id, name FROM adherents WHERE is_active = true'
    );

    if (activeAdherents.length === 0) {
      return sendResponse(res, 400, 'Aucun adhérent actif trouvé');
    }

    // Préparer les insertions
    const insertQueries = activeAdherents.map(adherent => ({
      query: `INSERT INTO adherent_contributions 
              (adherent_id, month_year, amount, amount_paid, penalty_amount, status) 
              VALUES (?, ?, ?, 0, 0, 'en_attente')`,
      params: [adherent.id, monthYear, DEFAULT_ADHERENT_CONTRIBUTION]
    }));

    // Exécuter en transaction
    await executeTransaction(insertQueries);

    return sendResponse(res, 201, `Abonnements générés pour ${activeAdherents.length} adhérents`, {
      month_year: monthYear,
      adherents_count: activeAdherents.length,
      total_expected: activeAdherents.length * DEFAULT_ADHERENT_CONTRIBUTION
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération des abonnements adhérents:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Générer automatiquement toutes les cotisations du mois courant
const generateCurrentMonthContributions = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Générer team members
    const teamResult = await generateTeamContributionsInternal(month, year);
    
    // Générer adhérents  
    const adherentResult = await generateAdherentContributionsInternal(month, year);

    return sendResponse(res, 201, 'Cotisations du mois générées automatiquement', {
      month: month,
      year: year,
      team_members: teamResult,
      adherents: adherentResult,
      total_expected: teamResult.total_expected + adherentResult.total_expected
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération automatique:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// =====================================================
// GESTION DES PAIEMENTS AVEC SUPPORT DES AVANCES
// =====================================================

// Marquer une cotisation team member comme payée (avec support des paiements partiels)
const markTeamContributionPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_date, payment_mode, notes, partial_amount } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID invalide');
    }

    const contribution = await executeQuery(
      'SELECT tmc.*, tm.name as member_name FROM team_member_contributions tmc JOIN team_members tm ON tmc.team_member_id = tm.id WHERE tmc.id = ?',
      [id]
    );

    if (contribution.length === 0) {
      return sendResponse(res, 404, 'Cotisation non trouvée');
    }

    const currentContribution = contribution[0];

    // Vérifier les permissions pour changer de "paye" vers "en_attente"
    if (currentContribution.status === 'paye' && req.user.role !== 'admin') {
      return sendResponse(res, 403, 'Seul l\'administrateur peut modifier un paiement déjà effectué');
    }

    const updateDate = payment_date || new Date().toISOString().split('T')[0];
    const updateMode = payment_mode || 'cash';

    // Calculer le nouveau montant payé
    let newAmountPaid = currentContribution.amount_paid || 0;
    let newStatus = currentContribution.status;
    let paymentAmount = 0;

    if (partial_amount && parseFloat(partial_amount) > 0) {
      // Paiement partiel/avance
      paymentAmount = parseFloat(partial_amount);
      newAmountPaid += paymentAmount;
      
      // Vérifier que le montant total ne dépasse pas le montant attendu
      if (newAmountPaid > currentContribution.amount) {
        return sendResponse(res, 400, 'Le montant total payé ne peut pas dépasser le montant attendu');
      }
      
      // Déterminer le nouveau statut
      newStatus = newAmountPaid >= currentContribution.amount ? 'paye' : 'en_attente';
    } else {
      // Paiement du solde restant
      paymentAmount = currentContribution.amount - newAmountPaid;
      newAmountPaid = currentContribution.amount;
      newStatus = 'paye';
    }

    // Mettre à jour la cotisation
    await executeQuery(`
      UPDATE team_member_contributions 
      SET status = ?, 
          amount_paid = ?,
          payment_date = ?, 
          payment_mode = ?, 
          notes = CASE 
            WHEN ? IS NOT NULL THEN CONCAT(IFNULL(notes, ''), CASE WHEN notes IS NOT NULL THEN '\n' ELSE '' END, ?) 
            ELSE notes 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, newAmountPaid, updateDate, updateMode, notes, notes, id]);

    // Créer une transaction correspondante pour traçabilité
    if (paymentAmount > 0) {
      const transactionDescription = `Cotisation ${new Date(currentContribution.month_year).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})} - ${currentContribution.member_name}`;
      const reference = `COT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      await executeQuery(`
        INSERT INTO transactions (
          reference, category_id, amount, type, description, 
          transaction_date, payment_mode, status, created_by, validated_by, validated_at
        ) VALUES (?, 2, ?, 'recette', ?, ?, ?, 'validee', ?, ?, CURRENT_TIMESTAMP)
      `, [reference, paymentAmount, transactionDescription, updateDate, updateMode, req.user.id, req.user.id]);
    }

    // Récupérer la cotisation mise à jour avec infos membre
    const updatedContribution = await executeQuery(`
      SELECT tmc.*, tm.name as member_name, tm.position
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE tmc.id = ?
    `, [id]);

    const successMessage = newStatus === 'paye' 
      ? 'Cotisation marquée comme payée complètement'
      : `Avance de ${formatAmount(paymentAmount)} enregistrée`;

    return sendResponse(res, 200, successMessage, {
      contribution: {
        ...updatedContribution[0],
        remaining_amount: updatedContribution[0].amount - updatedContribution[0].amount_paid
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du marquage du paiement:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Marquer un abonnement adhérent comme payé (avec support des paiements partiels)
const markAdherentContributionPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_date, payment_mode, notes, partial_amount } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID invalide');
    }

    const contribution = await executeQuery(
      'SELECT ac.*, a.name as adherent_name FROM adherent_contributions ac JOIN adherents a ON ac.adherent_id = a.id WHERE ac.id = ?',
      [id]
    );

    if (contribution.length === 0) {
      return sendResponse(res, 404, 'Abonnement non trouvé');
    }

    const currentContribution = contribution[0];

    // Vérifier les permissions
    if (currentContribution.status === 'paye' && req.user.role !== 'admin') {
      return sendResponse(res, 403, 'Seul l\'administrateur peut modifier un paiement déjà effectué');
    }

    const updateDate = payment_date || new Date().toISOString().split('T')[0];
    const updateMode = payment_mode || 'cash';

    // Calculer le nouveau montant payé
    let newAmountPaid = currentContribution.amount_paid || 0;
    let newStatus = currentContribution.status;
    let paymentAmount = 0;

    if (partial_amount && parseFloat(partial_amount) > 0) {
      // Paiement partiel/avance
      paymentAmount = parseFloat(partial_amount);
      newAmountPaid += paymentAmount;
      
      if (newAmountPaid > currentContribution.amount) {
        return sendResponse(res, 400, 'Le montant total payé ne peut pas dépasser le montant attendu');
      }
      
      newStatus = newAmountPaid >= currentContribution.amount ? 'paye' : 'en_attente';
    } else {
      // Paiement du solde restant
      paymentAmount = currentContribution.amount - newAmountPaid;
      newAmountPaid = currentContribution.amount;
      newStatus = 'paye';
    }

    // Mettre à jour l'abonnement
    await executeQuery(`
      UPDATE adherent_contributions 
      SET status = ?, 
          amount_paid = ?,
          payment_date = ?, 
          payment_mode = ?, 
          notes = CASE 
            WHEN ? IS NOT NULL THEN CONCAT(IFNULL(notes, ''), CASE WHEN notes IS NOT NULL THEN '\n' ELSE '' END, ?) 
            ELSE notes 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, newAmountPaid, updateDate, updateMode, notes, notes, id]);

    // Créer une transaction correspondante
    if (paymentAmount > 0) {
      const transactionDescription = `Abonnement ${new Date(currentContribution.month_year).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})} - ${currentContribution.adherent_name}`;
      const reference = `ABN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      await executeQuery(`
        INSERT INTO transactions (
          reference, category_id, amount, type, description, 
          transaction_date, payment_mode, status, created_by, validated_by, validated_at
        ) VALUES (?, 2, ?, 'recette', ?, ?, ?, 'validee', ?, ?, CURRENT_TIMESTAMP)
      `, [reference, paymentAmount, transactionDescription, updateDate, updateMode, req.user.id, req.user.id]);
    }

    // Récupérer l'abonnement mis à jour avec infos adhérent
    const updatedContribution = await executeQuery(`
      SELECT ac.*, a.name as adherent_name
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE ac.id = ?
    `, [id]);

    const successMessage = newStatus === 'paye' 
      ? 'Abonnement marqué comme payé complètement'
      : `Avance de ${formatAmount(paymentAmount)} enregistrée`;

    return sendResponse(res, 200, successMessage, {
      contribution: {
        ...updatedContribution[0],
        remaining_amount: updatedContribution[0].amount - updatedContribution[0].amount_paid
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du marquage du paiement:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// =====================================================
// RÉCUPÉRATION DES DONNÉES AVEC MONTANTS PAYÉS
// =====================================================

// Récupérer les cotisations team members par mois (avec support des montants payés)
const getTeamContributions = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    if (year && month) {
      whereConditions.push('YEAR(tmc.month_year) = ? AND MONTH(tmc.month_year) = ?');
      queryParams.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions.push('YEAR(tmc.month_year) = ?');
      queryParams.push(parseInt(year));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const contributions = await executeQuery(`
      SELECT 
        tmc.*,
        tm.name as member_name,
        tm.position,
        COALESCE(tmc.amount_paid, 0) as amount_paid,
        (tmc.amount - COALESCE(tmc.amount_paid, 0)) as remaining_amount,
        DATEDIFF(CURDATE(), LAST_DAY(tmc.month_year)) as days_late,
        CASE 
          WHEN tmc.status = 'paye' THEN 'Payé complet'
          WHEN COALESCE(tmc.amount_paid, 0) > 0 AND tmc.status = 'en_attente' THEN 'Avance partielle'
          WHEN DATEDIFF(CURDATE(), LAST_DAY(tmc.month_year)) > 0 AND tmc.status = 'en_attente' THEN 'En retard'
          ELSE 'En attente'
        END as payment_status
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      ${whereClause}
      ORDER BY tmc.month_year DESC, tm.name
    `, queryParams);

    // Statistiques du mois avec montants payés
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'en_attente' THEN 1 ELSE 0 END) as pending_count,
        SUM(COALESCE(amount_paid, 0)) as total_collected,
        SUM(amount) as total_expected,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 ELSE 0 END) as partial_payments
      FROM team_member_contributions tmc
      ${whereClause}
    `, queryParams);

    const statsResult = stats[0];
    const collectionRate = statsResult.total_expected > 0 ? 
      (statsResult.total_collected / statsResult.total_expected * 100).toFixed(1) : 0;

    return sendResponse(res, 200, 'Cotisations team members récupérées', {
      contributions,
      stats: {
        ...statsResult,
        partial_payments: statsResult.partial_payments || 0
      },
      collection_rate: collectionRate
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des cotisations team:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer les abonnements adhérents par mois (avec support des montants payés)
const getAdherentContributions = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let whereConditions = [];
    let queryParams = [];

    if (year && month) {
      whereConditions.push('YEAR(ac.month_year) = ? AND MONTH(ac.month_year) = ?');
      queryParams.push(parseInt(year), parseInt(month));
    } else if (year) {
      whereConditions.push('YEAR(ac.month_year) = ?');
      queryParams.push(parseInt(year));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const contributions = await executeQuery(`
      SELECT 
        ac.*,
        a.name as adherent_name,
        COALESCE(ac.amount_paid, 0) as amount_paid,
        (ac.amount - COALESCE(ac.amount_paid, 0)) as remaining_amount,
        DATEDIFF(CURDATE(), LAST_DAY(ac.month_year)) as days_late,
        CASE 
          WHEN ac.status = 'paye' THEN 'Payé complet'
          WHEN COALESCE(ac.amount_paid, 0) > 0 AND ac.status = 'en_attente' THEN 'Avance partielle'
          WHEN DATEDIFF(CURDATE(), LAST_DAY(ac.month_year)) > 0 AND ac.status = 'en_attente' THEN 'En retard'
          ELSE 'En attente'
        END as payment_status
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      ${whereClause}
      ORDER BY ac.month_year DESC, a.name
    `, queryParams);

    // Statistiques du mois avec montants payés
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'en_attente' THEN 1 ELSE 0 END) as pending_count,
        SUM(COALESCE(amount_paid, 0)) as total_collected,
        SUM(amount) as total_expected,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 ELSE 0 END) as partial_payments
      FROM adherent_contributions ac
      ${whereClause}
    `, queryParams);

    const statsResult = stats[0];
    const collectionRate = statsResult.total_expected > 0 ? 
      (statsResult.total_collected / statsResult.total_expected * 100).toFixed(1) : 0;

    return sendResponse(res, 200, 'Abonnements adhérents récupérés', {
      contributions,
      stats: {
        ...statsResult,
        partial_payments: statsResult.partial_payments || 0
      },
      collection_rate: collectionRate
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des abonnements adhérents:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// =====================================================
// FONCTIONS UTILITAIRES INTERNES
// =====================================================

const generateTeamContributionsInternal = async (month, year) => {
  const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  const existing = await executeQuery(
    'SELECT COUNT(*) as count FROM team_member_contributions WHERE month_year = ?',
    [monthYear]
  );

  if (existing[0].count > 0) {
    throw new Error('Cotisations team déjà générées pour ce mois');
  }

  const activeMembers = await executeQuery(
    'SELECT id FROM team_members WHERE is_active = true'
  );

  const insertQueries = activeMembers.map(member => ({
    query: `INSERT INTO team_member_contributions 
            (team_member_id, month_year, amount, amount_paid, penalty_amount, status) 
            VALUES (?, ?, ?, 0, 0, 'en_attente')`,
    params: [member.id, monthYear, DEFAULT_TEAM_CONTRIBUTION]
  }));

  await executeTransaction(insertQueries);

  return {
    members_count: activeMembers.length,
    total_expected: activeMembers.length * DEFAULT_TEAM_CONTRIBUTION
  };
};

const generateAdherentContributionsInternal = async (month, year) => {
  const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  const existing = await executeQuery(
    'SELECT COUNT(*) as count FROM adherent_contributions WHERE month_year = ?',
    [monthYear]
  );

  if (existing[0].count > 0) {
    throw new Error('Abonnements adhérents déjà générés pour ce mois');
  }

  const activeAdherents = await executeQuery(
    'SELECT id FROM adherents WHERE is_active = true'
  );

  const insertQueries = activeAdherents.map(adherent => ({
    query: `INSERT INTO adherent_contributions 
            (adherent_id, month_year, amount, amount_paid, penalty_amount, status) 
            VALUES (?, ?, ?, 0, 0, 'en_attente')`,
    params: [adherent.id, monthYear, DEFAULT_ADHERENT_CONTRIBUTION]
  }));

  await executeTransaction(insertQueries);

  return {
    adherents_count: activeAdherents.length,
    total_expected: activeAdherents.length * DEFAULT_ADHERENT_CONTRIBUTION
  };
};

// Fonction utilitaire pour formater les montants
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

module.exports = {
  generateTeamContributions,
  generateAdherentContributions,
  generateCurrentMonthContributions,
  markTeamContributionPaid,
  markAdherentContributionPaid,
  getTeamContributions,
  getAdherentContributions,
};