/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const { executeQuery, executeTransaction } = require('../config/database');
const { sanitizeInput, isValidEmail, isValidPhone, sendResponse, generateReference } = require('../utils/helpers');

// Constantes pour les frais d'adhésion et cotisations
const ADHESION_FEE = 1000;
const ADHESION_CATEGORY_ID = 1;
const DEFAULT_TEAM_CONTRIBUTION = 2000;
const DEFAULT_ADHERENT_CONTRIBUTION = 500;


// FONCTIONS UTILITAIRES POUR AUTO-GÉNÉRATION


/**
 * Récupère tous les mois déjà générés en base de données
 */
const getGeneratedMonths = async (type = 'team') => {
  const table = type === 'team' ? 'team_member_contributions' : 'adherent_contributions';
  
  const months = await executeQuery(`
    SELECT DISTINCT month_year 
    FROM ${table} 
    ORDER BY month_year
  `);
  
  return months.map(m => m.month_year);
};

/**
 * Crée les cotisations pour un membre sur tous les mois déjà générés
 */
const createMemberContributions = async (memberId, registrationDate, type = 'team') => {
  try {
    const table = type === 'team' ? 'team_member_contributions' : 'adherent_contributions';
    const idColumn = type === 'team' ? 'team_member_id' : 'adherent_id';
    const amount = type === 'team' ? DEFAULT_TEAM_CONTRIBUTION : DEFAULT_ADHERENT_CONTRIBUTION;
    
    // Récupérer tous les mois déjà générés
    const generatedMonths = await getGeneratedMonths(type);
    
    if (generatedMonths.length === 0) {
      console.log(`ℹ️ Aucun mois généré pour ${type}, pas de cotisation à créer`);
      return { created: 0, months: [] };
    }
    
    // Extraire uniquement année et mois pour comparaison
    const registrationDateObj = new Date(registrationDate);
    const registrationYear = registrationDateObj.getFullYear();
    const registrationMonth = registrationDateObj.getMonth(); // 0-11 (janvier = 0, décembre = 11)
    
    console.log(`📅 Membre inscrit : ${registrationYear}-${registrationMonth + 1} (mois ${registrationMonth})`);
    
    // Préparer les insertions
    const insertQueries = generatedMonths.map(monthYear => {
      const monthYearObj = new Date(monthYear);
      const monthYear_year = monthYearObj.getFullYear();
      const monthYear_month = monthYearObj.getMonth(); // 0-11
      
      // Comparer année-mois uniquement (pas le jour)
      let status = 'en_attente';
      
      if (monthYear_year < registrationYear) {
        // Année antérieure à l'inscription
        status = 'non_concerne';
        console.log(`  ❌ ${monthYear} → non_concerne (année ${monthYear_year} < ${registrationYear})`);
      } else if (monthYear_year === registrationYear && monthYear_month < registrationMonth) {
        // Même année mais mois antérieur
        status = 'non_concerne';
        console.log(`  ❌ ${monthYear} → non_concerne (mois ${monthYear_month} < ${registrationMonth})`);
      } else {
        console.log(`  ✅ ${monthYear} → en_attente (mois ${monthYear_month} >= ${registrationMonth})`);
      }
      
      return {
        query: `INSERT INTO ${table} 
                (${idColumn}, month_year, amount, amount_paid, penalty_amount, status) 
                VALUES (?, ?, ?, 0, 0, ?)`,
        params: [memberId, monthYear, amount, status]
      };
    });
    
    // Exécuter en transaction
    await executeTransaction(insertQueries);
    
    console.log(`✅ ${insertQueries.length} cotisations créées pour ${type} ID ${memberId}`);
    
    return {
      created: insertQueries.length,
      months: generatedMonths
    };
    
  } catch (error) {
    console.error(`❌ Erreur création cotisations pour ${type}:`, error.message);
    throw error;
  }
};


// TEAM MEMBERS (Membres du Bureau)


// Récupérer tous les team members
const getTeamMembers = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let whereClause = active_only === 'true' ? 'WHERE is_active = true' : '';

    const teamMembers = await executeQuery(`
      SELECT id, name, email, phone, position, registration_date, is_active, penalty_amount, notes, created_at
      FROM team_members 
      ${whereClause}
      ORDER BY name
    `);

    return sendResponse(res, 200, 'Membres du bureau récupérés avec succès', {
      team_members: teamMembers,
      count: teamMembers.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des membres du bureau:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Créer un team member
const createTeamMember = async (req, res) => {
  try {
    const { name, email, phone, position, registration_date, notes } = req.body;

    if (!name || !registration_date) {
      return sendResponse(res, 400, 'Nom et date d\'inscription requis');
    }

    const cleanName = sanitizeInput(name);
    const cleanEmail = email ? sanitizeInput(email.toLowerCase()) : null;
    const cleanPhone = phone ? sanitizeInput(phone) : null;
    const cleanPosition = position ? sanitizeInput(position) : null;
    const cleanNotes = notes ? sanitizeInput(notes) : null;

    // Validations
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return sendResponse(res, 400, 'Format d\'email invalide');
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
      return sendResponse(res, 400, 'Format de téléphone invalide');
    }

    // Vérifier unicité de l'email si fourni
    if (cleanEmail) {
      const existingEmail = await executeQuery(
        'SELECT id FROM team_members WHERE email = ?',
        [cleanEmail]
      );

      if (existingEmail.length > 0) {
        return sendResponse(res, 409, 'Un membre avec cet email existe déjà');
      }
    }

    // Insérer le membre
    const result = await executeQuery(`
      INSERT INTO team_members (name, email, phone, position, registration_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cleanName, cleanEmail, cleanPhone, cleanPosition, registration_date, cleanNotes]);

    const newMemberId = result.insertId;

    // Créer les cotisations pour tous les mois déjà générés
    const contributionsResult = await createMemberContributions(
      newMemberId, 
      registration_date, 
      'team'
    );

    // Récupérer le membre créé
    const newMember = await executeQuery(
      'SELECT * FROM team_members WHERE id = ?',
      [newMemberId]
    );

    console.log(`✅ Team member créé: ${cleanName} (ID: ${newMemberId})`);
    console.log(`   📊 Cotisations auto-générées: ${contributionsResult.created} mois`);

    return sendResponse(res, 201, 'Membre du bureau créé avec succès', {
      team_member: newMember[0],
      contributions_generated: contributionsResult.created,
      months: contributionsResult.months
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du team member:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Modifier un team member
const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, is_active, penalty_amount, notes } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID invalide');
    }

    // Vérifier existence
    const existing = await executeQuery('SELECT * FROM team_members WHERE id = ?', [id]);
    if (existing.length === 0) {
      return sendResponse(res, 404, 'Membre du bureau non trouvé');
    }

    // Préparer les champs à mettre à jour
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(sanitizeInput(name));
    }

    if (email !== undefined) {
      const cleanEmail = email ? sanitizeInput(email.toLowerCase()) : null;
      if (cleanEmail && !isValidEmail(cleanEmail)) {
        return sendResponse(res, 400, 'Format d\'email invalide');
      }
      
      // Vérifier unicité
      if (cleanEmail) {
        const emailCheck = await executeQuery(
          'SELECT id FROM team_members WHERE email = ? AND id != ?',
          [cleanEmail, id]
        );
        if (emailCheck.length > 0) {
          return sendResponse(res, 409, 'Un membre avec cet email existe déjà');
        }
      }
      
      updateFields.push('email = ?');
      updateValues.push(cleanEmail);
    }

    if (phone !== undefined) {
      const cleanPhone = phone ? sanitizeInput(phone) : null;
      if (cleanPhone && !isValidPhone(cleanPhone)) {
        return sendResponse(res, 400, 'Format de téléphone invalide');
      }
      updateFields.push('phone = ?');
      updateValues.push(cleanPhone);
    }

    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position ? sanitizeInput(position) : null);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (penalty_amount !== undefined) {
      updateFields.push('penalty_amount = ?');
      updateValues.push(parseFloat(penalty_amount) || 0);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes ? sanitizeInput(notes) : null);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, 400, 'Aucun champ à mettre à jour');
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE team_members SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updated = await executeQuery('SELECT * FROM team_members WHERE id = ?', [id]);

    return sendResponse(res, 200, 'Membre du bureau mis à jour avec succès', {
      team_member: updated[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du team member:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// ADHERENTS

// Récupérer tous les adhérents
const getAdherents = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    
    let whereClause = active_only === 'true' ? 'WHERE is_active = true' : '';

    const adherents = await executeQuery(`
      SELECT id, name, email, phone, registration_date, is_active, penalty_amount, notes, created_at
      FROM adherents 
      ${whereClause}
      ORDER BY name
    `);

    return sendResponse(res, 200, 'Adhérents récupérés avec succès', {
      adherents: adherents,
      count: adherents.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des adhérents:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Créer un adhérent
const createAdherent = async (req, res) => {
  try {
    const { name, email, phone, registration_date, notes } = req.body;

    if (!name || !registration_date) {
      return sendResponse(res, 400, 'Nom et date d\'inscription requis');
    }

    const cleanName = sanitizeInput(name);
    const cleanEmail = email ? sanitizeInput(email.toLowerCase()) : null;
    const cleanPhone = phone ? sanitizeInput(phone) : null;
    const cleanNotes = notes ? sanitizeInput(notes) : null;

    // Validations
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return sendResponse(res, 400, 'Format d\'email invalide');
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
      return sendResponse(res, 400, 'Format de téléphone invalide');
    }

    // Vérifier unicité de l'email si fourni
    if (cleanEmail) {
      const existingEmail = await executeQuery(
        'SELECT id FROM adherents WHERE email = ?',
        [cleanEmail]
      );

      if (existingEmail.length > 0) {
        return sendResponse(res, 409, 'Un adhérent avec cet email existe déjà');
      }
    }

    // Insérer l'adhérent
    const result = await executeQuery(`
      INSERT INTO adherents (name, email, phone, registration_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [cleanName, cleanEmail, cleanPhone, registration_date, cleanNotes]);

    const newAdherentId = result.insertId;

    // Créer les cotisations pour tous les mois déjà générés
    const contributionsResult = await createMemberContributions(
      newAdherentId, 
      registration_date, 
      'adherent'
    );

    // Enregistrer la transaction de frais d'adhésion
    const transactionRef = generateReference('ADH');
    
    await executeQuery(`
      INSERT INTO transactions 
      (reference, category_id, amount, type, description, transaction_date, payment_mode, status, created_by, validated_by, validated_at)
      VALUES (?, ?, ?, 'recette', ?, NOW(), 'cash', 'validee', 1, 1, NOW())
    `, [
      transactionRef,
      ADHESION_CATEGORY_ID,
      ADHESION_FEE,
      `Frais d'adhésion - ${cleanName}`
    ]);

    // Récupérer l'adhérent créé
    const newAdherent = await executeQuery(
      'SELECT * FROM adherents WHERE id = ?',
      [newAdherentId]
    );

    console.log(`✅ Adhérent créé: ${cleanName} (ID: ${newAdherentId})`);
    console.log(`   💰 Frais d'adhésion enregistrés: ${ADHESION_FEE} FCFA`);
    console.log(`   📊 Cotisations auto-générées: ${contributionsResult.created} mois`);

    return sendResponse(res, 201, 'Adhérent créé avec succès', {
      adherent: newAdherent[0],
      adhesion_fee: ADHESION_FEE,
      transaction_reference: transactionRef,
      contributions_generated: contributionsResult.created,
      months: contributionsResult.months
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'adhérent:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// Modifier un adhérent
const updateAdherent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, is_active, penalty_amount, notes } = req.body;

    if (!id || isNaN(id)) {
      return sendResponse(res, 400, 'ID invalide');
    }

    // Vérifier existence
    const existing = await executeQuery('SELECT * FROM adherents WHERE id = ?', [id]);
    if (existing.length === 0) {
      return sendResponse(res, 404, 'Adhérent non trouvé');
    }

    // Préparer les champs à mettre à jour
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(sanitizeInput(name));
    }

    if (email !== undefined) {
      const cleanEmail = email ? sanitizeInput(email.toLowerCase()) : null;
      if (cleanEmail && !isValidEmail(cleanEmail)) {
        return sendResponse(res, 400, 'Format d\'email invalide');
      }
      
      // Vérifier unicité
      if (cleanEmail) {
        const emailCheck = await executeQuery(
          'SELECT id FROM adherents WHERE email = ? AND id != ?',
          [cleanEmail, id]
        );
        if (emailCheck.length > 0) {
          return sendResponse(res, 409, 'Un adhérent avec cet email existe déjà');
        }
      }
      
      updateFields.push('email = ?');
      updateValues.push(cleanEmail);
    }

    if (phone !== undefined) {
      const cleanPhone = phone ? sanitizeInput(phone) : null;
      if (cleanPhone && !isValidPhone(cleanPhone)) {
        return sendResponse(res, 400, 'Format de téléphone invalide');
      }
      updateFields.push('phone = ?');
      updateValues.push(cleanPhone);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (penalty_amount !== undefined) {
      updateFields.push('penalty_amount = ?');
      updateValues.push(parseFloat(penalty_amount) || 0);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes ? sanitizeInput(notes) : null);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, 400, 'Aucun champ à mettre à jour');
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE adherents SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updated = await executeQuery('SELECT * FROM adherents WHERE id = ?', [id]);

    return sendResponse(res, 200, 'Adhérent mis à jour avec succès', {
      adherent: updated[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'adhérent:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

module.exports = {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  getAdherents,
  createAdherent,
  updateAdherent,
};