const { executeQuery } = require('../config/database');
const { sendResponse, formatAmount } = require('../utils/helpers');

// Récupérer les statistiques globales du dashboard (CORRIGÉ)
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

    // 2. Statistiques cotisations team members du mois (avec amount_paid)
    const teamStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_expected,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as total_paid,
        COALESCE(SUM(COALESCE(amount_paid, 0)), 0) as amount_collected,
        COALESCE(SUM(amount), 0) as amount_expected,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 ELSE 0 END) as partial_payments,
        AVG(COALESCE(amount_paid, 0) / amount * 100) as avg_completion_rate
      FROM team_member_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
    `, [currentYear, currentMonth]);

    const teamStats = teamStatsResult[0] || { 
      total_expected: 0, total_paid: 0, amount_collected: 0, 
      amount_expected: 0, partial_payments: 0, avg_completion_rate: 0 
    };

    // 3. Statistiques abonnements adhérents du mois (avec amount_paid)
    const adherentStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_expected,
        SUM(CASE WHEN status = 'paye' THEN 1 ELSE 0 END) as total_paid,
        COALESCE(SUM(COALESCE(amount_paid, 0)), 0) as amount_collected,
        COALESCE(SUM(amount), 0) as amount_expected,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 ELSE 0 END) as partial_payments,
        AVG(COALESCE(amount_paid, 0) / amount * 100) as avg_completion_rate
      FROM adherent_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
    `, [currentYear, currentMonth]);

    const adherentStats = adherentStatsResult[0] || { 
      total_expected: 0, total_paid: 0, amount_collected: 0, 
      amount_expected: 0, partial_payments: 0, avg_completion_rate: 0 
    };

    // 4. Transactions du mois
    const transactionStatsResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'en_attente' THEN 1 ELSE 0 END) as pending_transactions,
        COALESCE(SUM(CASE WHEN type = 'recette' AND status = 'validee' THEN amount ELSE 0 END), 0) as month_recettes,
        COALESCE(SUM(CASE WHEN type = 'depense' AND status = 'validee' THEN amount ELSE 0 END), 0) as month_depenses
      FROM transactions 
      WHERE YEAR(transaction_date) = ? AND MONTH(transaction_date) = ?
    `, [currentYear, currentMonth]);

    const transactionStats = transactionStatsResult[0] || { 
      total_transactions: 0, pending_transactions: 0, month_recettes: 0, month_depenses: 0 
    };

    // 5. Calculs dérivés (CORRIGÉS)
    const totalCotisationsMois = parseFloat(teamStats.amount_collected) + parseFloat(adherentStats.amount_collected);
    const totalCotisationsAttendu = parseFloat(teamStats.amount_expected) + parseFloat(adherentStats.amount_expected);
    const tauxRecouvrementGlobal = totalCotisationsAttendu > 0 ? 
      ((totalCotisationsMois / totalCotisationsAttendu) * 100).toFixed(1) : 0;

    // Calculer les autres recettes (hors cotisations)
    const autresRecettes = Math.max(0, parseFloat(transactionStats.month_recettes) - totalCotisationsMois);
    const soldeMois = parseFloat(transactionStats.month_recettes) - parseFloat(transactionStats.month_depenses);

    // 6. Évolution des 6 derniers mois avec amount_paid
    const evolutionResult = await executeQuery(`
      SELECT 
        YEAR(months.month_year) as year,
        MONTH(months.month_year) as month,
        COALESCE(SUM(tmc.amount_paid), 0) as team_collected,
        COALESCE(SUM(ac.amount_paid), 0) as adherent_collected,
        COALESCE(SUM(tmc.amount), 0) as team_expected,
        COALESCE(SUM(ac.amount), 0) as adherent_expected
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

    // 7. Détail des retards et avances
    const retardsAvancesResult = await executeQuery(`
      SELECT 
        'team' as type,
        COUNT(CASE WHEN DATEDIFF(CURDATE(), LAST_DAY(month_year)) > 0 AND status = 'en_attente' THEN 1 END) as en_retard,
        COUNT(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 END) as avec_avance,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN amount - COALESCE(amount_paid, 0) ELSE 0 END) as montant_restant
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ? AND tm.is_active = TRUE
      
      UNION ALL
      
      SELECT 
        'adherents' as type,
        COUNT(CASE WHEN DATEDIFF(CURDATE(), LAST_DAY(month_year)) > 0 AND status = 'en_attente' THEN 1 END) as en_retard,
        COUNT(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN 1 END) as avec_avance,
        SUM(CASE WHEN COALESCE(amount_paid, 0) > 0 AND COALESCE(amount_paid, 0) < amount THEN amount - COALESCE(amount_paid, 0) ELSE 0 END) as montant_restant
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ? AND a.is_active = TRUE
    `, [currentYear, currentMonth, currentYear, currentMonth]);

    // 8. Formater les réponses avec des valeurs numériques propres
    return sendResponse(res, 200, 'Statistiques dashboard récupérées', {
      global: {
        solde_global: parseFloat(soldeGlobal),
        total_recettes_all_time: parseFloat(balanceResult[0].total_recettes),
        total_depenses_all_time: parseFloat(balanceResult[0].total_depenses)
      },
      mois_courant: {
        year: parseInt(currentYear),
        month: parseInt(currentMonth),
        solde_mois: parseFloat(soldeMois),
        cotisations_collectees: parseFloat(totalCotisationsMois), // ✅ CORRIGÉ: nombre au lieu de concaténation
        cotisations_attendues: parseFloat(totalCotisationsAttendu), // ✅ CORRIGÉ: nombre au lieu de concaténation
        taux_recouvrement: parseFloat(tauxRecouvrementGlobal), // ✅ CORRIGÉ: calcul correct
        recettes_autres: parseFloat(autresRecettes),
        depenses: parseFloat(transactionStats.month_depenses)
      },
      team_members: {
        membres_attendus: parseInt(teamStats.total_expected),
        membres_payes: parseInt(teamStats.total_paid),
        membres_avec_avance: parseInt(teamStats.partial_payments),
        montant_collecte: parseFloat(teamStats.amount_collected),
        montant_attendu: parseFloat(teamStats.amount_expected),
        taux_recouvrement: teamStats.amount_expected > 0 ? 
          parseFloat(((teamStats.amount_collected / teamStats.amount_expected) * 100).toFixed(1)) : 0,
        taux_completion_moyen: parseFloat(teamStats.avg_completion_rate || 0).toFixed(1)
      },
      adherents: {
        adherents_attendus: parseInt(adherentStats.total_expected),
        adherents_payes: parseInt(adherentStats.total_paid),
        adherents_avec_avance: parseInt(adherentStats.partial_payments),
        montant_collecte: parseFloat(adherentStats.amount_collected),
        montant_attendu: parseFloat(adherentStats.amount_expected),
        taux_recouvrement: adherentStats.amount_expected > 0 ? 
          parseFloat(((adherentStats.amount_collected / adherentStats.amount_expected) * 100).toFixed(1)) : 0,
        taux_completion_moyen: parseFloat(adherentStats.avg_completion_rate || 0).toFixed(1)
      },
      transactions: {
        total_mois: parseInt(transactionStats.total_transactions),
        en_attente: parseInt(transactionStats.pending_transactions)
      },
      evolution_6_mois: evolutionResult.map(item => ({
        year: parseInt(item.year),
        month: parseInt(item.month),
        team_collected: parseFloat(item.team_collected || 0),
        adherent_collected: parseFloat(item.adherent_collected || 0),
        team_expected: parseFloat(item.team_expected || 0),
        adherent_expected: parseFloat(item.adherent_expected || 0)
      })),
      retards_avances: retardsAvancesResult.map(item => ({
        type: item.type,
        en_retard: parseInt(item.en_retard),
        avec_avance: parseInt(item.avec_avance),
        montant_restant: parseFloat(item.montant_restant || 0)
      }))
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques dashboard:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer les transactions récentes
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validation du paramètre limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return sendResponse(res, 400, 'Le paramètre limit doit être un nombre entre 1 et 50');
    }
    
    // Requête pour récupérer les transactions récentes avec toutes les informations nécessaires
    const recentTransactions = await executeQuery(`
      SELECT 
        t.id,
        t.reference,
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
        validator.name as validated_by_name,
        t.validated_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users validator ON t.validated_by = validator.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `, [limitNum]);

    return sendResponse(res, 200, 'Transactions récentes récupérées avec succès', {
      transactions: recentTransactions,
      count: recentTransactions.length,
      limit: limitNum
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des transactions récentes:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer les membres avec le plus de retard
const getLateContributions = async (req, res) => {
  try {
    // Team members en retard avec montants
    const lateTeamMembers = await executeQuery(`
      SELECT 
        'team' as type,
        tm.name,
        tm.position,
        tmc.month_year,
        tmc.amount,
        COALESCE(tmc.amount_paid, 0) as amount_paid,
        (tmc.amount - COALESCE(tmc.amount_paid, 0)) as remaining_amount,
        DATEDIFF(CURDATE(), LAST_DAY(tmc.month_year)) as days_late
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE tmc.status = 'en_attente' 
        AND LAST_DAY(tmc.month_year) < CURDATE()
        AND tm.is_active = true
      ORDER BY days_late DESC, remaining_amount DESC
      LIMIT 10
    `);

    // Adhérents en retard avec montants
    const lateAdherents = await executeQuery(`
      SELECT 
        'adherent' as type,
        a.name,
        ac.month_year,
        ac.amount,
        COALESCE(ac.amount_paid, 0) as amount_paid,
        (ac.amount - COALESCE(ac.amount_paid, 0)) as remaining_amount,
        DATEDIFF(CURDATE(), LAST_DAY(ac.month_year)) as days_late
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE ac.status = 'en_attente' 
        AND LAST_DAY(ac.month_year) < CURDATE()
        AND a.is_active = true
      ORDER BY days_late DESC, remaining_amount DESC
      LIMIT 10
    `);

    // Membres avec avances en cours
    const membersWithAdvances = await executeQuery(`
      SELECT 
        'team' as type,
        tm.name,
        tm.position,
        tmc.month_year,
        tmc.amount,
        COALESCE(tmc.amount_paid, 0) as amount_paid,
        (tmc.amount - COALESCE(tmc.amount_paid, 0)) as remaining_amount,
        ROUND(COALESCE(tmc.amount_paid, 0) / tmc.amount * 100, 1) as completion_percentage
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE COALESCE(tmc.amount_paid, 0) > 0 
        AND COALESCE(tmc.amount_paid, 0) < tmc.amount
        AND tm.is_active = true
      
      UNION ALL
      
      SELECT 
        'adherent' as type,
        a.name,
        NULL as position,
        ac.month_year,
        ac.amount,
        COALESCE(ac.amount_paid, 0) as amount_paid,
        (ac.amount - COALESCE(ac.amount_paid, 0)) as remaining_amount,
        ROUND(COALESCE(ac.amount_paid, 0) / ac.amount * 100, 1) as completion_percentage
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE COALESCE(ac.amount_paid, 0) > 0 
        AND COALESCE(ac.amount_paid, 0) < ac.amount
        AND a.is_active = true
      
      ORDER BY completion_percentage DESC
      LIMIT 15
    `);

    return sendResponse(res, 200, 'Membres en retard et avances récupérés', {
      team_members_en_retard: lateTeamMembers,
      adherents_en_retard: lateAdherents,
      membres_avec_avances: membersWithAdvances,
      total_late: lateTeamMembers.length + lateAdherents.length,
      total_with_advances: membersWithAdvances.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des retards:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Récupérer un rapport financier détaillé
const getFinancialReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || (currentDate.getMonth() + 1);

    // Résumé financier global du mois
    const financialSummary = await executeQuery(`
      SELECT 
        'Recettes Transactions' as source,
        COALESCE(SUM(CASE WHEN type = 'recette' AND status = 'validee' 
          AND YEAR(transaction_date) = ? AND MONTH(transaction_date) = ? THEN amount ELSE 0 END), 0) as montant
      FROM transactions
      
      UNION ALL
      
      SELECT 
        'Cotisations Team' as source,
        COALESCE(SUM(amount_paid), 0) as montant
      FROM team_member_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
      
      UNION ALL
      
      SELECT 
        'Abonnements Adhérents' as source,
        COALESCE(SUM(amount_paid), 0) as montant
      FROM adherent_contributions 
      WHERE YEAR(month_year) = ? AND MONTH(month_year) = ?
      
      UNION ALL
      
      SELECT 
        'Dépenses' as source,
        -COALESCE(SUM(CASE WHEN type = 'depense' AND status = 'validee' 
          AND YEAR(transaction_date) = ? AND MONTH(transaction_date) = ? THEN amount ELSE 0 END), 0) as montant
      FROM transactions
    `, [targetYear, targetMonth, targetYear, targetMonth, targetYear, targetMonth, targetYear, targetMonth]);

    // Top contributeurs du mois
    const topContributors = await executeQuery(`
      SELECT 
        tm.name,
        tm.position,
        'Team Member' as type,
        COALESCE(tmc.amount_paid, 0) as amount_paid,
        tmc.amount as amount_expected,
        ROUND(COALESCE(tmc.amount_paid, 0) / tmc.amount * 100, 1) as completion_rate,
        tmc.payment_date
      FROM team_member_contributions tmc
      JOIN team_members tm ON tmc.team_member_id = tm.id
      WHERE YEAR(tmc.month_year) = ? AND MONTH(tmc.month_year) = ?
        AND COALESCE(tmc.amount_paid, 0) > 0
      
      UNION ALL
      
      SELECT 
        a.name,
        'Adhérent' as position,
        'Adherent' as type,
        COALESCE(ac.amount_paid, 0) as amount_paid,
        ac.amount as amount_expected,
        ROUND(COALESCE(ac.amount_paid, 0) / ac.amount * 100, 1) as completion_rate,
        ac.payment_date
      FROM adherent_contributions ac
      JOIN adherents a ON ac.adherent_id = a.id
      WHERE YEAR(ac.month_year) = ? AND MONTH(ac.month_year) = ?
        AND COALESCE(ac.amount_paid, 0) > 0
      
      ORDER BY amount_paid DESC, completion_rate DESC
      LIMIT 10
    `, [targetYear, targetMonth, targetYear, targetMonth]);

    // Répartition par catégorie des transactions
    const categoryBreakdown = await executeQuery(`
      SELECT 
        c.name as category_name,
        c.type as category_type,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(CASE WHEN t.status = 'validee' THEN t.amount ELSE 0 END), 0) as total_amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND YEAR(t.transaction_date) = ? AND MONTH(t.transaction_date) = ?
        AND t.status = 'validee'
      WHERE c.is_active = 1
      GROUP BY c.id, c.name, c.type
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `, [targetYear, targetMonth]);

    return sendResponse(res, 200, 'Rapport financier généré', {
      period: {
        year: parseInt(targetYear),
        month: parseInt(targetMonth),
        month_name: new Date(targetYear, targetMonth - 1).toLocaleDateString('fr-FR', { month: 'long' })
      },
      financial_summary: financialSummary,
      top_contributors: topContributors,
      category_breakdown: categoryBreakdown
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  getDashboardStats,
  getRecentTransactions,
  getLateContributions,
  getFinancialReport
};