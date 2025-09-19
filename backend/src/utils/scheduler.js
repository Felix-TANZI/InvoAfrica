const { executeQuery, executeTransaction } = require('../config/database');

// Montants par défaut
const DEFAULT_TEAM_CONTRIBUTION = 2000;
const DEFAULT_ADHERENT_CONTRIBUTION = 500;

// Variable pour stocker le dernier mois généré (éviter double génération)
let lastGeneratedMonth = null;

// Fonction principale du scheduler
const checkAndGenerateMonthlyContributions = async () => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based
    const currentDay = now.getDate();

    // Exécuter seulement le 1er du mois
    if (currentDay !== 1) {
      return;
    }

    // Éviter de générer plusieurs fois le même mois
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    if (lastGeneratedMonth === currentMonthKey) {
      console.log(`🔄 Cotisations pour ${currentMonthKey} déjà générées`);
      return;
    }

    console.log(`📅 Génération automatique des cotisations pour ${currentMonthKey}...`);

    // Générer les cotisations team members
    const teamResult = await generateTeamContributionsScheduler(currentMonth, currentYear);
    
    // Générer les abonnements adhérents
    const adherentResult = await generateAdherentContributionsScheduler(currentMonth, currentYear);

    // Marquer comme généré
    lastGeneratedMonth = currentMonthKey;

    console.log('✅ =======================================');
    console.log('   COTISATIONS GÉNÉRÉES AUTOMATIQUEMENT');
    console.log('✅ =======================================');
    console.log(`📅 Mois: ${currentMonthKey}`);
    console.log(`👥 Team Members: ${teamResult.members_count} (${teamResult.total_expected} FCFA)`);
    console.log(`🎯 Adhérents: ${adherentResult.adherents_count} (${adherentResult.total_expected} FCFA)`);
    console.log(`💰 Total attendu: ${teamResult.total_expected + adherentResult.total_expected} FCFA`);
    console.log('========================================');

  } catch (error) {
    console.error('❌ Erreur lors de la génération automatique des cotisations:', error.message);
    
    // Ne pas bloquer l'application, juste logger l'erreur
    // Dans le futur, on pourrait ajouter un système de notification
  }
};

// Générer cotisations team members (version scheduler)
const generateTeamContributionsScheduler = async (month, year) => {
  const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  // Vérifier si déjà générées
  const existing = await executeQuery(
    'SELECT COUNT(*) as count FROM team_member_contributions WHERE month_year = ?',
    [monthYear]
  );

  if (existing[0].count > 0) {
    console.log(`⚠️ Cotisations team déjà existantes pour ${monthYear}`);
    return { members_count: 0, total_expected: 0 };
  }

  // Récupérer membres actifs
  const activeMembers = await executeQuery(
    'SELECT id, name FROM team_members WHERE is_active = true'
  );

  if (activeMembers.length === 0) {
    console.log('⚠️ Aucun membre du bureau actif trouvé');
    return { members_count: 0, total_expected: 0 };
  }

  // Préparer insertions
  const insertQueries = activeMembers.map(member => ({
    query: `INSERT INTO team_member_contributions 
            (team_member_id, month_year, amount, penalty_amount, status) 
            VALUES (?, ?, ?, 0, 'en_attente')`,
    params: [member.id, monthYear, DEFAULT_TEAM_CONTRIBUTION]
  }));

  // Exécuter en transaction
  await executeTransaction(insertQueries);

  console.log(`✅ ${activeMembers.length} cotisations team créées`);
  
  return {
    members_count: activeMembers.length,
    total_expected: activeMembers.length * DEFAULT_TEAM_CONTRIBUTION
  };
};

// Générer abonnements adhérents (version scheduler)
const generateAdherentContributionsScheduler = async (month, year) => {
  const monthYear = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  // Vérifier si déjà générées
  const existing = await executeQuery(
    'SELECT COUNT(*) as count FROM adherent_contributions WHERE month_year = ?',
    [monthYear]
  );

  if (existing[0].count > 0) {
    console.log(`⚠️ Abonnements adhérents déjà existants pour ${monthYear}`);
    return { adherents_count: 0, total_expected: 0 };
  }

  // Récupérer adhérents actifs
  const activeAdherents = await executeQuery(
    'SELECT id, name FROM adherents WHERE is_active = true'
  );

  if (activeAdherents.length === 0) {
    console.log('⚠️ Aucun adhérent actif trouvé');
    return { adherents_count: 0, total_expected: 0 };
  }

  // Préparer insertions
  const insertQueries = activeAdherents.map(adherent => ({
    query: `INSERT INTO adherent_contributions 
            (adherent_id, month_year, amount, penalty_amount, status) 
            VALUES (?, ?, ?, 0, 'en_attente')`,
    params: [adherent.id, monthYear, DEFAULT_ADHERENT_CONTRIBUTION]
  }));

  // Exécuter en transaction
  await executeTransaction(insertQueries);

  console.log(`✅ ${activeAdherents.length} abonnements adhérents créés`);

  return {
    adherents_count: activeAdherents.length,
    total_expected: activeAdherents.length * DEFAULT_ADHERENT_CONTRIBUTION
  };
};

// Démarrer le scheduler (vérifie chaque heure)
const startScheduler = () => {
  console.log('🕐 Scheduler des cotisations démarré (vérification toutes les heures)');
  
  // Vérifier immédiatement au démarrage
  checkAndGenerateMonthlyContributions();
  
  // Puis vérifier toutes les heures (3600000 ms = 1 heure)
  setInterval(checkAndGenerateMonthlyContributions, 3600000);
};

module.exports = {
  startScheduler,
  checkAndGenerateMonthlyContributions,
};