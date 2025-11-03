/* Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.5 - Templates FINAL (Rapport Financier Fixé) */

const { 
  CLUB_INFO, 
  ASSETS_PATH, 
  PDF_CONFIG, 
  PDF_TEXTS,
  STATUS_LABELS,
  TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  getStatusLabel,
  getTypeLabel
} = require('../config/pdfConfig');

const {
  formatAmount,
  formatDate,
  generateQRCode,
  drawHeader,
  drawFooter,
  drawTable,
  drawInfoSection,
  drawSummaryBox,
  truncateText,
  extractMemberName
} = require('../utils/pdfHelpers');

/**
 * LOGIQUE DE PIED DE PAGE ET SIGNATURE DÉDIÉE À LA DERNIÈRE PAGE
 */
const finalizeDocument = (doc, footerText) => {
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    const { ASSETS_PATH } = require('../config/pdfConfig');
    
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        const isLastPage = (i === totalPages - 1);
        
        // La signature n'est incluse que sur la dernière page
        const signature = isLastPage ? ASSETS_PATH.signature : null;
        
        drawFooter(doc, i + 1, totalPages, footerText, signature);
    }
}


/**
 * REÇU DE TRANSACTION
 */
async function generateReceiptPDF(doc, transaction) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // EN-TÊTE
  let y = drawHeader(
    doc, 
    PDF_TEXTS.receipt.title, 
    PDF_TEXTS.receipt.subtitle,
    ASSETS_PATH.logo
  );
  
  y += 5;
  
  // NUMÉRO DE RÉFÉRENCE
  const refBoxY = y;
  const refBoxWidth = dimensions.pageWidth - margins.left - margins.right;
  
  doc.rect(margins.left, refBoxY, refBoxWidth, 40)
     .fillAndStroke(colors.bgBlueLight, colors.primary);
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('Numéro de Référence', margins.left, refBoxY + 8, {
       width: refBoxWidth,
       align: 'center'
     });
  
  doc.fontSize(18)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(transaction.reference, margins.left, refBoxY + 20, {
       width: refBoxWidth,
       align: 'center'
     });
  
  y = refBoxY + 50;
  
  // SECTION PRINCIPALE - Informations en colonnes
  const leftColX = margins.left + 10;
  const rightColX = dimensions.pageWidth / 2 + 20;
  const colWidth = (dimensions.pageWidth / 2) - margins.left - 30;
  
  // COLONNE GAUCHE
  let leftY = y;
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('Détails de la Transaction', leftColX, leftY);
  
  leftY += 18;
  
  const leftInfo = [
    { label: 'Date', value: formatDate(transaction.transaction_date, 'medium') },
    { label: 'Type', value: getTypeLabel(transaction.type).text },
    { label: 'Catégorie', value: transaction.category_name || 'Non catégorisée' },
    { label: 'Mode de paiement', value: PAYMENT_MODE_LABELS[transaction.payment_mode] || transaction.payment_mode }
  ];
  
  doc.fontSize(fonts.body)
     .fillColor(colors.text)
     .font('Helvetica');
  
  leftInfo.forEach(item => {
    doc.fillColor(colors.textLight)
       .font('Helvetica')
       .text(`${item.label}:`, leftColX, leftY, { width: 110, continued: false });
    
    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(item.value, leftColX + 115, leftY, { width: colWidth - 115 });
    
    leftY += 16;
  });
  
  // Contact
  if (transaction.contact_person) {
    leftY += 2;
    doc.fillColor(colors.textLight)
       .font('Helvetica')
       .text('Contact:', leftColX, leftY, { width: 110 });
    
    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(transaction.contact_person, leftColX + 115, leftY, { width: colWidth - 115 });
    
    leftY += 16;
  }
  
  // COLONNE DROITE
  let rightY = y;
  
  const amountBoxHeight = 75;
  const amountBoxWidth = colWidth + 20;
  
  doc.rect(rightColX - 10, rightY, amountBoxWidth, amountBoxHeight)
     .fillAndStroke(colors.bgLight, colors.border);
  
  const typeColor = transaction.type === 'recette' ? colors.success : colors.danger;
  doc.rect(rightColX - 10, rightY, amountBoxWidth, 4)
     .fill(typeColor);
  
  rightY += 10;
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('MONTANT', rightColX, rightY, { width: amountBoxWidth - 20, align: 'center' });
  
  rightY += 16;
  
  doc.fontSize(22)
     .fillColor(typeColor)
     .font('Helvetica-Bold')
     .text(formatAmount(transaction.amount), rightColX, rightY, {
       width: amountBoxWidth - 20,
       align: 'center'
     });
  
  rightY += 30;
  
  // Statut
  const statusInfo = getStatusLabel(transaction.status);
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('Statut', rightColX, rightY, { width: amountBoxWidth - 20, align: 'center' });
  
  rightY += 11;
  
  const badgeWidth = 95;
  const badgeX = rightColX + (amountBoxWidth - badgeWidth) / 2 - 10;
  
  doc.roundedRect(badgeX, rightY - 3, badgeWidth, 18, 3)
     .fill(statusInfo.color);
  
  doc.fontSize(fonts.body)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text(`${statusInfo.icon} ${statusInfo.text}`, badgeX, rightY - 2, {
       width: badgeWidth,
       align: 'center'
     });
  
  // DESCRIPTION
  y = Math.max(leftY, rightY + amountBoxHeight) + 8;
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('Description', margins.left + 10, y);
  
  y += 14;
  
  const descBoxWidth = dimensions.pageWidth - margins.left - margins.right - 20;
  const descText = transaction.description || 'Aucune description fournie';
  // Correction: utiliser doc.heightOfString pour déterminer la hauteur
  const descHeight = Math.max(35, doc.heightOfString(descText, { width: descBoxWidth - 16 }) + 14);
  
  doc.rect(margins.left + 10, y, descBoxWidth, descHeight)
     .fillAndStroke(colors.bgLight, colors.border);
  
  doc.fontSize(fonts.body)
     .fillColor(colors.text)
     .font('Helvetica')
     .text(descText, margins.left + 18, y + 7, {
       width: descBoxWidth - 16,
       align: 'justify'
     });
  
  y += descHeight + 10;
  
  // NOTES
  if (transaction.notes) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Note: ${transaction.notes}`, margins.left + 10, y, {
         width: dimensions.pageWidth - margins.left - margins.right - 20
       });
    y += 18;
  }
  
  // VALIDATION INFO
  if (transaction.status === 'validee' && transaction.validated_by_name) {
    y += 4;
    
    const validBoxWidth = 270;
    const validBoxX = margins.left + 10;
    
    doc.rect(validBoxX, y, validBoxWidth, 40)
       .fillAndStroke('#d1fae5', '#10b981');
    
    doc.fontSize(fonts.small)
       .fillColor('#065f46')
       .font('Helvetica')
       .text('Transaction validée', validBoxX + 10, y + 7);
    
    doc.fontSize(fonts.body)
       .text(`Par: ${transaction.validated_by_name}`, validBoxX + 10, y + 19);
    
    if (transaction.validated_at) {
      doc.text(`Le: ${formatDate(transaction.validated_at, 'medium')}`, validBoxX + 10, y + 30);
    }
    
    y += 48;
  }
  
  //  QR CODE - Positionné intelligemment
  const qrSize = 80;
  const qrX = margins.left + 20;
  let qrY = y;
  
  // S'assurer que le QR code ne superpose pas la signature (située à footerY - 100)
  const footerClearance = dimensions.pageHeight - margins.bottom - 100;
  if (qrY + qrSize + 20 > footerClearance) {
     qrY = footerClearance - qrSize - 20;
  }
  
  const qrData = `${process.env.FRONTEND_URL || 'https://gi-enspy.com'}/verify/${transaction.reference}`;
  const qrCode = await generateQRCode(qrData);
  
  if (qrCode) {
    doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
       .stroke(colors.border);
    
    doc.image(qrCode, qrX, qrY, {
      width: qrSize,
      height: qrSize
    });
    
    doc.fontSize(fonts.tiny)
       .fillColor(colors.textLight)
       .font('Helvetica')
       .text(PDF_TEXTS.receipt.qrText, qrX - 8, qrY + qrSize + 5, {
         width: qrSize + 16,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE avec signature
  drawFooter(doc, 1, 1, PDF_TEXTS.receipt.footer, ASSETS_PATH.signature);
}

/**
 * LISTE DES TRANSACTIONS
 */
async function generateTransactionListPDF(doc, transactions, filters, statistics) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  let subtitle = `Export réalisé le ${formatDate(new Date(), 'medium')}`;
  if (filters.date_from && filters.date_to) {
    subtitle = `Période: ${formatDate(filters.date_from, 'short')} au ${formatDate(filters.date_to, 'short')}`;
  } else if (filters.date_from) {
    subtitle = `À partir du ${formatDate(filters.date_from, 'short')}`;
  } else if (filters.date_to) {
    subtitle = `Jusqu'au ${formatDate(filters.date_to, 'short')}`;
  }
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    PDF_TEXTS.transactionList.title,
    subtitle,
    ASSETS_PATH.logo
  );
  
  // STATISTIQUES
  if (statistics && Object.keys(statistics).length > 0) {
    const statsItems = [
      { 
        label: 'Total Transactions', 
        value: String(statistics.total || 0), 
        color: colors.text 
      },
      { 
        label: 'Recettes', 
        value: formatAmount(statistics.montant_recettes || 0), 
        color: colors.success 
      },
      { 
        label: 'Dépenses', 
        value: formatAmount(statistics.montant_depenses || 0), 
        color: colors.danger 
      },
      { 
        label: 'Solde Net', 
        value: formatAmount(statistics.solde || 0), 
        color: statistics.solde >= 0 ? colors.success : colors.danger 
      }
    ];
    
    y = drawSummaryBox(
      doc, 
      statsItems, 
      margins.left, 
      y, 
      dimensions.pageWidth - margins.left - margins.right,
      { title: 'Résumé Financier', layout: 'horizontal' }
    );
  }
  
  // FILTRES
  const activeFilters = [];
  if (filters.status) activeFilters.push(`Statut: ${getStatusLabel(filters.status).text}`);
  if (filters.type) activeFilters.push(`Type: ${getTypeLabel(filters.type).text}`);
  if (filters.category_id) activeFilters.push(`Catégorie: ${filters.category_name || filters.category_id}`);
  if (filters.search) activeFilters.push(`Recherche: "${filters.search}"`);
  if (filters.amount_min) activeFilters.push(`Montant min: ${formatAmount(filters.amount_min)}`);
  if (filters.amount_max) activeFilters.push(`Montant max: ${formatAmount(filters.amount_max)}`);
  
  if (activeFilters.length > 0) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Filtres: ${activeFilters.join(' • ')}`, margins.left, y, { 
         width: dimensions.pageWidth - margins.left - margins.right
       });
    y += 22;
  }
  
  //  TABLEAU AVEC COLONNES
  if (transactions.length > 0) {
    // Optimisation de la largeur des colonnes
    const headers = ['Réf.', 'Date', 'Membre', 'Description', 'Catégorie', 'Montant', 'Statut'];
    const columnWidths = [45, 55, 90, 110, 60, 65, 70]; // Somme = 495
    
    const rows = transactions.map(t => {
      const memberName = extractMemberName(t);
      
      return [
        t.reference,
        formatDate(t.transaction_date, 'short'),
        truncateText(memberName, 20), // Troncature ajustée
        truncateText(t.description || '', 25), // Troncature ajustée
        truncateText(t.category_name || 'N/A', 15),
        formatAmount(t.amount),
        getStatusLabel(t.status).text
      ];
    });
    
    y = drawTable(doc, headers, rows, y, { 
      columnWidths,
      fontSize: fonts.tiny,
      alignRight: [5], // Montant
      rowHeightAuto: true
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(PDF_TEXTS.transactionList.noData, margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE AVEC SIGNATURE sur dernière page
  finalizeDocument(doc, PDF_TEXTS.transactionList.footer);
}

/**
 * TEMPLATE: RAPPORT FINANCIER (VISUEL AMÉLIORÉ et symboles corrigés)
 */
async function generateFinancialReportPDF(doc, data) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    PDF_TEXTS.financialReport.title,
    `Période analysée: ${data.period || 'Non spécifiée'}`,
    ASSETS_PATH.logo
  );
  
  // NOUVEAU: TABLEAU RÉCAPITULATIF SOLDE INITIAL/FINAL (Priorité si les données sont fournies)
  if (data.soldeInitial !== undefined && data.soldeFinal !== undefined) {
      const summaryInfo = {
          'Solde Initial (Début période)': formatAmount(data.soldeInitial || 0),
          'Total Recettes': formatAmount(data.totalRecettes || 0),
          'Total Dépenses': formatAmount(data.totalDepenses || 0),
          'Solde Final (Fin période)': formatAmount(data.soldeFinal || (data.soldeInitial + data.totalRecettes - data.totalDepenses) || 0)
      };

      y = drawInfoSection(doc, 'RÉSUMÉ DE LA PÉRIODE', summaryInfo, y, {
          bordered: true,
          bgColor: colors.bgLight,
          keyColor: colors.text
      });
      y -= 15;
  } else {
    // Ancien format d'encadrés si les données initiales/finales ne sont pas là
    
    // RÉSUMÉ FINCIER - 3 Encadrés (Correction des symboles bizarres)
    const boxWidth = (dimensions.pageWidth - margins.left - margins.right - 40) / 3;
    let boxX = margins.left;
    const boxY = y;
    const boxHeight = 85;
    
    const financialBoxes = [
      {
        label: 'RECETTES',
        value: formatAmount(data.totalRecettes || 0),
        color: colors.success
      },
      {
        label: 'DÉPENSES',
        value: formatAmount(data.totalDepenses || 0),
        color: colors.danger
      },
      {
        label: 'SOLDE NET',
        value: formatAmount((data.totalRecettes || 0) - (data.totalDepenses || 0)),
        color: (data.totalRecettes - data.totalDepenses) >= 0 ? colors.success : colors.danger
      }
    ];

    financialBoxes.forEach((box) => {
        doc.rect(boxX, boxY, boxWidth, boxHeight)
        .fill(colors.bgLight);
        
        doc.rect(boxX, boxY, 5, boxHeight) // Barre de couleur
        .fill(box.color);
        
        doc.rect(boxX, boxY, boxWidth, boxHeight)
        .stroke(colors.border);
        
        doc.fontSize(fonts.small)
        .fillColor(colors.textLight)
        .font('Helvetica')
        .text(box.label, boxX + 15, boxY + 15, {
            width: boxWidth - 20,
            align: 'center'
        });
        
        // La valeur est centrée verticalement
        doc.fontSize(fonts.heading)
        .fillColor(box.color)
        .font('Helvetica-Bold')
        .text(box.value, boxX + 15, boxY + 35, { 
            width: boxWidth - 20,
            align: 'center'
        });
        
        boxX += boxWidth + 20;
    });

    y = boxY + boxHeight + 30;

  } // Fin du bloc de résumé financier
  
  
  // RÉPARTITION PAR CATÉGORIE
  if (data.byCategory && data.byCategory.length > 0) {
    doc.fontSize(fonts.subheading)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('ANALYSE DÉTAILLÉE PAR CATÉGORIE', margins.left, y); // Titre amélioré
    
    y += 25;
    
    const headers = ['Catégorie', 'Type', 'Nb Trans.', 'Montant Total', '% du Total'];
    const columnWidths = [185, 75, 75, 90, 70]; // Somme = 495
    
    // Pourcentage est calculé par rapport au total de Recettes ou Dépenses
    const totalRecettes = data.totalRecettes || 0;
    const totalDepenses = data.totalDepenses || 0;

    const rows = data.byCategory.map(cat => {
      const amount = parseFloat(cat.total_amount || 0);
      const percentageBase = cat.category_type === 'recette' ? totalRecettes : totalDepenses;
      
      let percentage = 0;
      if (percentageBase > 0) {
          percentage = (amount / percentageBase) * 100;
      }
      
      return [
        truncateText(cat.category_name, 25),
        getTypeLabel(cat.category_type).text,
        String(cat.transaction_count || 0),
        formatAmount(amount),
        `${percentage.toFixed(1)}%`
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      alignRight: [2, 3, 4], // Nb Trans., Montant Total, % du Total
      rowHeightAuto: true
    });
  }
  
  // SECTION COMMENTAIRES
  y += 15;
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(PDF_TEXTS.financialReport.commentSection, margins.left, y);
  
  y += 20;
  
  const commentBoxHeight = 80;
  doc.rect(margins.left, y, dimensions.pageWidth - margins.left - margins.right, commentBoxHeight)
     .fillAndStroke(colors.bgLight, colors.border);
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica-Oblique')
     .text('[Espace réservé pour les commentaires du Chef de la Cellule Financière]', 
           margins.left + 15, y + 15, {
       width: dimensions.pageWidth - margins.left - margins.right - 30,
       align: 'left'
     });
  
  //  PIED DE PAGE avec signature
  finalizeDocument(doc, PDF_TEXTS.financialReport.footer);
}


/**
 * TEMPLATE: RELEVÉ MEMBRE 
 */
async function generateMemberStatementPDF(doc, member, contributions) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    PDF_TEXTS.memberStatement.title,
    `Document établi pour: ${member.name}`,
    ASSETS_PATH.logo
  );
  
  // INFORMATIONS MEMBRE
  const memberInfo = {
    'Nom complet': member.name,
    'Email': member.email || 'Non renseigné',
    'Téléphone': member.phone || 'Non renseigné',
    'Matricule': member.matricule || 'N/A',
    'Statut': member.status || 'Actif',
    'Date d\'adhésion': member.join_date ? formatDate(member.join_date, 'medium') : 'N/A'
  };
  
  y = drawInfoSection(doc, PDF_TEXTS.memberStatement.memberInfo, memberInfo, y, {
    bordered: true,
    bgColor: colors.bgBlueLight
  });
  
  // RÉSUMÉ COTISATIONS
  const paidContributions = contributions.filter(c => c.status === 'paid');
  const pendingContributions = contributions.filter(c => c.status === 'pending');
  
  const totalPaid = paidContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const totalPending = pendingContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  const totalOverall = totalPaid + totalPending;
  
  const summaryItems = [
    { 
      label: 'Total Payé', 
      value: formatAmount(totalPaid), 
      color: colors.success 
    },
    { 
      label: 'En Attente', 
      value: formatAmount(totalPending), 
      color: colors.warning 
    },
    { 
      label: 'Montant Total', 
      value: formatAmount(totalOverall), 
      color: colors.text 
    }
  ];
  
  y = drawSummaryBox(
    doc, 
    summaryItems, 
    margins.left, 
    y, 
    dimensions.pageWidth - margins.left - margins.right,
    { title: 'Résumé des Cotisations', layout: 'horizontal' }
  );
  
  // TABLEAU COTISATIONS
  if (contributions.length > 0) {
    doc.fontSize(fonts.subheading)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Historique Détaillé', margins.left, y);
    
    y += 20;
    
    const headers = ['Date d\'échéance', 'Type', 'Montant', 'Statut', 'Référence'];
    const columnWidths = [100, 110, 90, 80, 115]; // Somme = 495
    
    const rows = contributions.map(c => {
      const status = c.status === 'paid' ? 'Payée' : 'En attente';
      
      return [
        formatDate(c.due_date, 'short'),
        c.type_name || 'Cotisation',
        formatAmount(c.amount),
        status,
        c.reference || 'N/A'
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      alignRight: [2], // Montant
      rowHeightAuto: true
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text('Aucune cotisation enregistrée pour ce membre.', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE avec signature
  finalizeDocument(doc, PDF_TEXTS.memberStatement.footer);
}

/**
 * LISTE TEAM MEMBERS
 */
async function generateTeamMembersPDF(doc, teamMembers, filters) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  let subtitle = `Export réalisé le ${formatDate(new Date(), 'medium')}`;
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    'LISTE DES TEAM MEMBERS',
    subtitle,
    ASSETS_PATH.logo
  );
  
  // STATISTIQUES
  const activeMembers = teamMembers.filter(m => m.is_active).length;
  const paidMembers = teamMembers.filter(m => m.contribution_status === 'paye').length;
  
  const statsItems = [
    { label: 'Total Members', value: String(teamMembers.length), color: colors.text },
    { label: 'Actifs', value: String(activeMembers), color: colors.success },
    { label: 'Cotisations Payées', value: String(paidMembers), color: colors.info }
  ];
  
  y = drawSummaryBox(
    doc, 
    statsItems, 
    margins.left, 
    y, 
    dimensions.pageWidth - margins.left - margins.right,
    { title: 'Résumé', layout: 'horizontal' }
  );
  
  // FILTRES
  const activeFilters = [];
  if (filters.status) activeFilters.push(`Statut: ${filters.status}`);
  if (filters.contribution_status) activeFilters.push(`Cotisation: ${filters.contribution_status}`);
  
  if (activeFilters.length > 0) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Filtres: ${activeFilters.join(' • ')}`, margins.left, y, { 
         width: dimensions.pageWidth - margins.left - margins.right
       });
    y += 22;
  }
  
  // TABLEAU
  if (teamMembers.length > 0) {
    // Optimisation de la largeur des colonnes
    const headers = ['ID', 'Nom', 'Position', 'Email', 'Cotisation', 'Statut'];
    const columnWidths = [30, 120, 105, 120, 70, 50]; // Somme = 495
    
    const rows = teamMembers.map(m => {
      const contributionStatus = m.contribution_status === 'paye' ? '✓ Payée' : 
                                  m.contribution_status === 'avance' ? 'Avance' : 
                                  '✗ En attente';
      
      return [
        String(m.id),
        truncateText(m.name, 28),
        truncateText(m.position || '-', 25),
        truncateText(m.email || '-', 28),
        contributionStatus,
        m.is_active ? 'Actif' : 'Inactif'
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      fontSize: fonts.tiny,
      rowHeightAuto: true // Force le multi-lignes pour les noms et positions
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text('Aucun Team Member trouvé pour les critères sélectionnés', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE AVEC SIGNATURE 
  finalizeDocument(doc, 'Document officiel du Club Génie Informatique');
}

/**
 * LISTE ADHÉRENTS
 */
async function generateAdherentsPDF(doc, adherents, filters) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  let subtitle = `Export réalisé le ${formatDate(new Date(), 'medium')}`;
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    'LISTE DES ADHÉRENTS',
    subtitle,
    ASSETS_PATH.logo
  );
  
  // STATISTIQUES
  const activeAdherents = adherents.filter(a => a.is_active).length;
  const paidAdherents = adherents.filter(a => a.subscription_status === 'paye').length;
  
  const statsItems = [
    { label: 'Total Adhérents', value: String(adherents.length), color: colors.text },
    { label: 'Actifs', value: String(activeAdherents), color: colors.success },
    { label: 'Abonnements Payés', value: String(paidAdherents), color: colors.info }
  ];
  
  y = drawSummaryBox(
    doc, 
    statsItems, 
    margins.left, 
    y, 
    dimensions.pageWidth - margins.left - margins.right,
    { title: 'Résumé', layout: 'horizontal' }
  );
  
  // FILTRES
  const activeFilters = [];
  if (filters.status) activeFilters.push(`Statut: ${filters.status}`);
  if (filters.subscription_status) activeFilters.push(`Abonnement: ${filters.subscription_status}`);
  
  if (activeFilters.length > 0) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Filtres: ${activeFilters.join(' • ')}`, margins.left, y, { 
         width: dimensions.pageWidth - margins.left - margins.right
       });
    y += 22;
  }
  
  // TABLEAU
  if (adherents.length > 0) {
    // Optimisation de la largeur des colonnes
    const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Abonnement', 'Statut'];
    const columnWidths = [30, 130, 130, 80, 75, 50]; // Somme = 495
    
    const rows = adherents.map(a => {
      const subscriptionStatus = a.subscription_status === 'paye' ? '✓ Payé' : 
                                   a.subscription_status === 'avance' ? 'Avance' : 
                                   '✗ En attente';
      
      return [
        String(a.id),
        truncateText(a.name, 30),
        truncateText(a.email || '-', 30),
        truncateText(a.phone || '-', 18),
        subscriptionStatus,
        a.is_active ? 'Actif' : 'Inactif'
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      fontSize: fonts.tiny,
      rowHeightAuto: true
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text('Aucun Adhérent trouvé pour les critères sélectionnés', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE AVEC SIGNATURE 
  finalizeDocument(doc, 'Document officiel du Club Génie Informatique');
}

/**
 * COTISATIONS TEAM MEMBERS (Statistiques corrigées)
 */
async function generateTeamContributionsPDF(doc, contributions, filters) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const period = filters.month && filters.year ? 
    `${monthNames[filters.month - 1]} ${filters.year}` : 
    `Année ${filters.year || new Date().getFullYear()}`;
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    'COTISATIONS TEAM MEMBERS',
    `Période: ${period}`,
    ASSETS_PATH.logo
  );
  
  // STATISTIQUES (CALCULS CORRIGÉS)
  const totalCount = contributions.length; 
  const paidCount = contributions.filter(c => c.status === 'paye').length;
  
  // Utiliser reduce() pour sommer les montants réels
  const totalPaid = contributions.reduce((sum, c) => sum + parseFloat(c.amount_paid || 0), 0);
  const totalExpected = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  
  const statsItems = [
    { label: 'Total Membres', value: String(totalCount), color: colors.text },
    { label: 'Payés', value: String(paidCount), color: colors.success },
    { label: 'Collecté', value: formatAmount(totalPaid), color: colors.info },
    { label: 'Attendu', value: formatAmount(totalExpected), color: colors.warning }
  ];
  
  y = drawSummaryBox(
    doc, 
    statsItems, 
    margins.left, 
    y, 
    dimensions.pageWidth - margins.left - margins.right,
    { title: 'Résumé', layout: 'horizontal' }
  );
  
  // FILTRES
  const activeFilters = [];
  if (filters.paid === 'yes') activeFilters.push('Filtre: Cotisations payées');
  if (filters.paid === 'no') activeFilters.push('Filtre: Cotisations non payées');
  
  if (activeFilters.length > 0) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Filtres: ${activeFilters.join(' • ')}`, margins.left, y, { 
         width: dimensions.pageWidth - margins.left - margins.right
       });
    y += 22;
  }
  
  // TABLEAU
  if (contributions.length > 0) {
    // Optimisation de la largeur des colonnes
    const headers = ['Membre', 'Position', 'Montant', 'Payé', 'Reste', 'Statut'];
    const columnWidths = [140, 95, 70, 70, 60, 60]; // Somme = 495
    
    const rows = contributions.map(c => {
      const remaining = (c.amount || 0) - (c.amount_paid || 0);
      const status = c.status === 'paye' ? '✓ Payée' : 
                     c.amount_paid > 0 ? 'Avance' : 
                     '✗ En attente';
      
      return [
        truncateText(c.member_name || '-', 30),
        truncateText(c.position || '-', 25),
        formatAmount(c.amount),
        formatAmount(c.amount_paid || 0),
        formatAmount(remaining),
        status
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      fontSize: fonts.tiny,
      alignRight: [2, 3, 4], // Montant, Payé, Reste
      rowHeightAuto: true // Force le multi-lignes
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text('Aucune Cotisation Team Member trouvée pour les critères sélectionnés', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  //  PIED DE PAGE AVEC SIGNATURE 
  finalizeDocument(doc, 'Document officiel du Club Génie Informatique');
}

/**
 * ABONNEMENTS ADHÉRENTS (Statistiques corrigées)
 */
async function generateAdherentContributionsPDF(doc, contributions, filters) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const period = filters.month && filters.year ? 
    `${monthNames[filters.month - 1]} ${filters.year}` : 
    `Année ${filters.year || new Date().getFullYear()}`;
  
  // EN-TÊTE
  let y = drawHeader(
    doc,
    'ABONNEMENTS ADHÉRENTS',
    `Période: ${period}`,
    ASSETS_PATH.logo
  );
  
  // STATISTIQUES (CALCULS CORRIGÉS)
  const totalCount = contributions.length;
  const paidCount = contributions.filter(c => c.status === 'paye').length;
  
  // Utiliser reduce() pour sommer les montants réels
  const totalPaid = contributions.reduce((sum, c) => sum + parseFloat(c.amount_paid || 0), 0);
  const totalExpected = contributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  
  const statsItems = [
    { label: 'Total Adhérents', value: String(totalCount), color: colors.text },
    { label: 'Payés', value: String(paidCount), color: colors.success },
    { label: 'Collecté', value: formatAmount(totalPaid), color: colors.info },
    { label: 'Attendu', value: formatAmount(totalExpected), color: colors.warning }
  ];
  
  y = drawSummaryBox(
    doc, 
    statsItems, 
    margins.left, 
    y, 
    dimensions.pageWidth - margins.left - margins.right,
    { title: 'Résumé', layout: 'horizontal' }
  );
  
  // FILTRES
  const activeFilters = [];
  if (filters.paid === 'yes') activeFilters.push('Filtre: Abonnements payés');
  if (filters.paid === 'no') activeFilters.push('Filtre: Abonnements non payés');
  
  if (activeFilters.length > 0) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`${activeFilters.join(' • ')}`, margins.left, y, { 
         width: dimensions.pageWidth - margins.left - margins.right
       });
    y += 22;
  }
  
  // TABLEAU
  if (contributions.length > 0) {
    // Optimisation de la largeur des colonnes
    const headers = ['Adhérent', 'Email', 'Montant', 'Payé', 'Reste', 'Statut'];
    const columnWidths = [140, 140, 60, 60, 55, 40]; // Somme = 495
    
    const rows = contributions.map(c => {
      const remaining = (c.amount || 0) - (c.amount_paid || 0);
      const status = c.status === 'paye' ? '✓ Payé' : 
                     c.amount_paid > 0 ? 'Avance' : 
                     '✗ En attente';
      
      return [
        truncateText(c.adherent_name || '-', 30),
        truncateText(c.adherent_email || '-', 30),
        formatAmount(c.amount),
        formatAmount(c.amount_paid || 0),
        formatAmount(remaining),
        status
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      fontSize: fonts.tiny,
      alignRight: [2, 3, 4], // Montant, Payé, Reste
      rowHeightAuto: true
    });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text('Aucun Abonnement Adhérent trouvé pour les critères sélectionnés', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  // PIED DE PAGE AVEC SIGNATURE 
  finalizeDocument(doc, 'Document officiel du Club Génie Informatique');
}

module.exports = {
  generateReceiptPDF,
  generateTransactionListPDF,
  generateFinancialReportPDF,
  generateMemberStatementPDF,
  generateTeamMembersPDF,
  generateAdherentsPDF,
  generateTeamContributionsPDF,
  generateAdherentContributionsPDF
};