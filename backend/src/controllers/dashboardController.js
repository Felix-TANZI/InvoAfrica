const { executeQuery } = require('../config/database');
const { sendResponse, formatAmount } = require('../utils/helpers');

// Récupérer les statistiques globales du dashboard
const getDashboardStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const currentYear = year || currentDate.getFullYear();
    const currentMonth = month || (currentDate.getMonth() + 1);

    // 1. Solde global (toutes transactions validées)
    const balanceResult = await executeQuery(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'recette' AND status = 'validee' THEN amount ELSE 0 END), 0) as total_recettes,
        COALESCE(SUM(CASE WHEN type = 'depense' AND status = 'validee' THEN amount ELSE 0 END), 0) as total_depenses
      FROM transactions
    `);

    const soldeGlobal = balanceResult[0].total_recettes - balanceResult[0].total_depenses;

    // 2. Statistiques cotisations team members du mois
    const teamStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_expected,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'paye' THEN amount ELSE 0 END) as amount_collected,
        SUM(amount) as amount_expected
      FROM team_member_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
    `, [currentYear, currentMonth]);

    const teamStats = teamStatsResult[0] || { total_expected: 0, total_paid: 0, amount_collected: 0, amount_expected: 0 };

    // 3. Statistiques abonnements adhérents du mois
    const adherentStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_expected,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'paye' THEN amount ELSE 0 END) as amount_collected,
        SUM(amount) as amount_expected
      FROM adherent_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
    `, [currentYear, currentMonth]);

    const adherentStats = adherentStatsResult[0] || { total_expected: 0, total_paid: 0, amount_collected: 0, amount_expected: 0 };

    // 4. Transactions du mois
    const transactionStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'en_attente' THEN 1 ELSE 0 END) as pending_transactions,
        SUM(CASE WHEN type = 'recette' AND status = 'validee' THEN amount ELSE 0 END) as month_recettes,
        SUM(CASE WHEN type = 'depense' AND status = 'validee' THEN amount ELSE 0 END) as month_depenses
      FROM transactions 
      WHERE YEAR(transaction_date) = ? AND MONTH(transaction_date) = ?
    `, [currentYear, currentMonth]);

    const transactionStats = transactionStatsResult[0] || { total_transactions: 0, pending_transactions: 0, month_recettes: 0, month_depenses: 0 };

    // 5. Calculs dérivés
    const totalCotisationsMois = teamStats.amount_collected + adherentStats.amount_collected;
    const totalCotisationsAttendu = teamStats.amount_expected + adherentStats.amount_expected;
    const tauxRecouvrementGlobal = totalCotisationsAttendu > 0 ? 
      ((totalCotisationsMois / totalCotisationsAttendu) * 100).toFixed(1) : 0;

    const soldeMois = (transactionStats.month_recettes + totalCotisationsMois) - transactionStats.month_depenses;

    // 6. Évolution des 6 derniers mois (pour graphiques)
    const evolutionResult = await executeQuery(`
  SELECT 
    YEAR(months.month_year) as year,
    MONTH(months.month_year) as month,
    SUM(CASE WHEN tmc.status = 'paye' THEN tmc.amount ELSE 0 END) as team_collected,
    SUM(CASE WHEN ac.status = 'paye' THEN ac.amount ELSE 0 END) as adherent_collected
  FROM (
    SELECT DISTINCT month_year FROM team_member_contributions 
    WHERE month_year >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    UNION 
    SELECT DISTINCT month_year FROM adherent_contributions 
    WHERE month_year >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
  ) months
  LEFT JOIN team_member_contributions tmc ON months.month_year = tmc.month_year
  LEFT JOIN adherent_contributions ac ON months.month_year = ac.month_year
  GROUP BY YEAR(months.month_year), MONTH(months.month_year)
  ORDER BY year, month
  LIMIT 6
`);

    return sendResponse(res, 200, 'Statistiques dashboard récupérées', {
      global: {
        solde_global: soldeGlobal,
        total_recettes_all_time: balanceResult[0].total_recettes,
        total_depenses_all_time: balanceResult[0].total_depenses
      },
      mois_courant: {
        year: parseInt(currentYear),
        month: parseInt(currentMonth),
        solde_mois: soldeMois,
        cotisations_collectees: totalCotisationsMois,
        cotisations_attendues: totalCotisationsAttendu,
        taux_recouvrement: parseFloat(tauxRecouvrementGlobal),
        recettes_autres: transactionStats.month_recettes,
        depenses: transactionStats.month_depenses
      },
      team_members: {
        membres_attendus: teamStats.total_expected,
        membres_payes: teamStats.total_paid,
        montant_collecte: teamStats.amount_collected,
        montant_attendu: teamStats.amount_expected,
        taux_recouvrement: teamStats.amount_expected > 0 ? 
          ((teamStats.amount_collected / teamStats.amount_expected) * 100).toFixed(1) : 0
      },
      adherents: {
        adherents_attendus: adherentStats.total_expected,
        adherents_payes: adherentStats.total_paid,
        montant_collecte: adherentStats.amount_collected,
        montant_attendu: adherentStats.amount_expected,
        taux_recouvrement: adherentStats.amount_expected > 0 ? 
          ((adherentStats.amount_collected / adherentStats.amount_expected) * 100).toFixed(1) : 0
      },
      transactions: {
        total_mois: transactionStats.total_transactions,
        en_attente: transactionStats.pending_transactions
      },
      evolution_6_mois: evolutionResult
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques dashboard:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer les dernières transactions
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentTransactions = await executeQuery(`
      SELECT 
        t.id, t.reference, t.amount, t.type, t.description, 
        t.transaction_date, t.status, t.created_at,
        c.name as category_name,
        creator.name as created_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    return sendResponse(res, 200, 'Dernières transactions récupérées', {
      transactions: recentTransactions,
      count: recentTransactions.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dernières transactions:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer les membres en retard de cotisation
const getLateContributions = async (req, res) => {
  try {
    // Team members en retard
    const lateTeamMembers = await executeQuery(`
      SELECT 
        'team' as type,
        tm.name,
        tmc.month_year,
        tmc.amount,
        DATEDIFF(CURDATE(), LAST_DAY(tmc.month_year)) as days_late
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE tmc.status = 'en_attente' 
        AND LAST_DAY(tmc.month_year) < CURDATE()
        AND tm.is_active = true
      ORDER BY days_late DESC, tm.name
    `);

    // Adhérents en retard
    const lateAdherents = await executeQuery(`
      SELECT 
        'adherent' as type,
        a.name,
        ac.month_year,
        ac.amount,
        DATEDIFF(CURDATE(), LAST_DAY(ac.month_year)) as days_late
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE ac.status = 'en_attente' 
        AND LAST_DAY(ac.month_year) < CURDATE()
        AND a.is_active = true
      ORDER BY days_late DESC, a.name
    `);

    return sendResponse(res, 200, 'Membres en retard récupérés', {
      team_members: lateTeamMembers,
      adherents: lateAdherents,
      total_late: lateTeamMembers.length + lateAdherents.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des retards:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  getDashboardStats,
  getRecentTransactions,
  getLateContributions,
};