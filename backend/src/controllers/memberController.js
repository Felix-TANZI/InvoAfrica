const { executeQuery } = require('../config/database');
const { sanitizeInput, isValidEmail, isValidPhone, sendResponse } = require('../utils/helpers');

// =====================================================
// TEAM MEMBERS (Membres du Bureau)
// =====================================================

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

    const result = await executeQuery(`
      INSERT INTO team_members (name, email, phone, position, registration_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cleanName, cleanEmail, cleanPhone, cleanPosition, registration_date, cleanNotes]);

    const newMember = await executeQuery(
      'SELECT * FROM team_members WHERE id = ?',
      [result.insertId]
    );

    return sendResponse(res, 201, 'Membre du bureau créé avec succès', {
      team_member: newMember[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du membre du bureau:', error.message);
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

    const existingMember = await executeQuery('SELECT id FROM team_members WHERE id = ?', [id]);
    if (existingMember.length === 0) {
      return sendResponse(res, 404, 'Membre non trouvé');
    }

    let updateFields = [];
    let updateParams = [];

    if (name) {
      updateFields.push('name = ?');
      updateParams.push(sanitizeInput(name));
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return sendResponse(res, 400, 'Format d\'email invalide');
      }
      updateFields.push('email = ?');
      updateParams.push(email ? sanitizeInput(email.toLowerCase()) : null);
    }
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return sendResponse(res, 400, 'Format de téléphone invalide');
      }
      updateFields.push('phone = ?');
      updateParams.push(phone ? sanitizeInput(phone) : null);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateParams.push(position ? sanitizeInput(position) : null);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active ? 1 : 0);
    }
    if (penalty_amount !== undefined) {
      updateFields.push('penalty_amount = ?');
      updateParams.push(parseFloat(penalty_amount) || 0);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes ? sanitizeInput(notes) : null);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, 400, 'Aucune donnée à mettre à jour');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(id);

    await executeQuery(`
      UPDATE team_members 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateParams);

    const updatedMember = await executeQuery('SELECT * FROM team_members WHERE id = ?', [id]);

    return sendResponse(res, 200, 'Membre modifié avec succès', {
      team_member: updatedMember[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification du membre:', error.message);
    return sendResponse(res, 500, 'Erreur interne du serveur');
  }
};

// =====================================================
// ADHERENTS
// =====================================================

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

    const result = await executeQuery(`
      INSERT INTO adherents (name, email, phone, registration_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [cleanName, cleanEmail, cleanPhone, registration_date, cleanNotes]);

    const newAdherent = await executeQuery(
      'SELECT * FROM adherents WHERE id = ?',
      [result.insertId]
    );

    return sendResponse(res, 201, 'Adhérent créé avec succès', {
      adherent: newAdherent[0]
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

    const existingAdherent = await executeQuery('SELECT id FROM adherents WHERE id = ?', [id]);
    if (existingAdherent.length === 0) {
      return sendResponse(res, 404, 'Adhérent non trouvé');
    }

    let updateFields = [];
    let updateParams = [];

    if (name) {
      updateFields.push('name = ?');
      updateParams.push(sanitizeInput(name));
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return sendResponse(res, 400, 'Format d\'email invalide');
      }
      updateFields.push('email = ?');
      updateParams.push(email ? sanitizeInput(email.toLowerCase()) : null);
    }
    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return sendResponse(res, 400, 'Format de téléphone invalide');
      }
      updateFields.push('phone = ?');
      updateParams.push(phone ? sanitizeInput(phone) : null);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateParams.push(is_active ? 1 : 0);
    }
    if (penalty_amount !== undefined) {
      updateFields.push('penalty_amount = ?');
      updateParams.push(parseFloat(penalty_amount) || 0);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes ? sanitizeInput(notes) : null);
    }

    if (updateFields.length === 0) {
      return sendResponse(res, 400, 'Aucune donnée à mettre à jour');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(id);

    await executeQuery(`
      UPDATE adherents 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateParams);

    const updatedAdherent = await executeQuery('SELECT * FROM adherents WHERE id = ?', [id]);

    return sendResponse(res, 200, 'Adhérent modifié avec succès', {
      adherent: updatedAdherent[0]
    });

  } catch (error) {
    console.error('❌ Erreur lors de la modification de l\'adhérent:', error.message);
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