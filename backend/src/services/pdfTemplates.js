/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - PDF Templates  */

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
 
 * 1️⃣ TEMPLATE: REÇU DE TRANSACTION 
 
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
  
  y += 5; //  Réduction espace
  
  // NUMÉRO DE RÉFÉRENCE
  const refBoxY = y;
  const refBoxWidth = dimensions.pageWidth - margins.left - margins.right;
  
  doc.rect(margins.left, refBoxY, refBoxWidth, 45) //  Réduction hauteur 50→45
     .fillAndStroke(colors.bgBlueLight, colors.primary);
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('Numéro de Référence', margins.left, refBoxY + 10, {
       width: refBoxWidth,
       align: 'center'
     });
  
  doc.fontSize(20) //  Réduction taille 22→20
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(transaction.reference, margins.left, refBoxY + 23, {
       width: refBoxWidth,
       align: 'center'
     });
  
  y = refBoxY + 55; //  Réduction espace 65→55
  
  // SECTION PRINCIPALE - Informations en colonnes
  const leftColX = margins.left + 10;
  const rightColX = dimensions.pageWidth / 2 + 20;
  const colWidth = (dimensions.pageWidth / 2) - margins.left - 30;
  
  // COLONNE GAUCHE
  let leftY = y;
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('Détails de la Transaction', leftColX, leftY); // 
  
  leftY += 20; //  Réduction espace 25→20
  
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
       .text(`${item.label}:`, leftColX, leftY, { width: 120, continued: false });
    
    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(item.value, leftColX + 125, leftY, { width: colWidth - 125 });
    
    leftY += 18; //  Réduction espace 22→18
  });
  
  // Contact
  if (transaction.contact_person) {
    leftY += 3;
    doc.fillColor(colors.textLight)
       .font('Helvetica')
       .text('Contact:', leftColX, leftY, { width: 120 });
    
    doc.fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(transaction.contact_person, leftColX + 125, leftY, { width: colWidth - 125 });
    
    leftY += 18;
  }
  
  // COLONNE DROITE
  let rightY = y;
  
  const amountBoxHeight = 85; //
  const amountBoxWidth = colWidth + 20;
  
  doc.rect(rightColX - 10, rightY, amountBoxWidth, amountBoxHeight)
     .fillAndStroke(colors.bgLight, colors.border);
  
  const typeColor = transaction.type === 'recette' ? colors.success : colors.danger;
  doc.rect(rightColX - 10, rightY, amountBoxWidth, 4)
     .fill(typeColor);
  
  rightY += 12;
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('MONTANT', rightColX, rightY, { width: amountBoxWidth - 20, align: 'center' });
  
  rightY += 18;
  
  doc.fontSize(24) // 
     .fillColor(typeColor)
     .font('Helvetica-Bold')
     .text(formatAmount(transaction.amount), rightColX, rightY, {
       width: amountBoxWidth - 20,
       align: 'center'
     });
  
  rightY += 35;
  
  // Statut
  const statusInfo = getStatusLabel(transaction.status);
  
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text('Statut', rightColX, rightY, { width: amountBoxWidth - 20, align: 'center' });
  
  rightY += 13;
  
  const badgeWidth = 100;
  const badgeX = rightColX + (amountBoxWidth - badgeWidth) / 2 - 10;
  
  doc.roundedRect(badgeX, rightY - 3, badgeWidth, 20, 3) //  Réduction 22→20
     .fill(statusInfo.color);
  
  doc.fontSize(fonts.body)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text(`${statusInfo.icon} ${statusInfo.text}`, badgeX, rightY - 1, {
       width: badgeWidth,
       align: 'center'
     });
  
  // DESCRIPTION
  y = Math.max(leftY, rightY + amountBoxHeight) + 10; //  Réduction 15→10
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('Description', margins.left + 10, y); 
  
  y += 15;
  
  const descBoxWidth = dimensions.pageWidth - margins.left - margins.right - 20;
  const descText = transaction.description || 'Aucune description fournie';
  const descHeight = Math.max(40, Math.ceil(descText.length / 90) * 18); //  Optimisé
  
  doc.rect(margins.left + 10, y, descBoxWidth, descHeight)
     .fillAndStroke(colors.bgLight, colors.border);
  
  doc.fontSize(fonts.body)
     .fillColor(colors.text)
     .font('Helvetica')
     .text(descText, margins.left + 20, y + 8, {
       width: descBoxWidth - 20,
       align: 'justify'
     });
  
  y += descHeight + 12; //  Réduction 20→12
  
  // NOTES
  if (transaction.notes) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .font('Helvetica-Oblique')
       .text(`Note: ${transaction.notes}`, margins.left + 10, y, {
         width: dimensions.pageWidth - margins.left - margins.right - 20
       });
    y += 20;
  }
  
  // VALIDATION INFO
  if (transaction.status === 'validee' && transaction.validated_by_name) {
    y += 5;
    
    const validBoxWidth = 280; //  Réduction 300→280
    const validBoxX = margins.left + 10;
    
    doc.rect(validBoxX, y, validBoxWidth, 45) //  Réduction 50→45
       .fillAndStroke('#d1fae5', '#10b981');
    
    doc.fontSize(fonts.small)
       .fillColor('#065f46')
       .font('Helvetica')
       .text('Transaction validée', validBoxX + 10, y + 8); 
    
    doc.fontSize(fonts.body)
       .text(`Par: ${transaction.validated_by_name}`, validBoxX + 10, y + 22);
    
    if (transaction.validated_at) {
      doc.text(`Le: ${formatDate(transaction.validated_at, 'medium')}`, validBoxX + 10, y + 34);
    }
    
    y += 55;
  }
  
  // QR CODE - Optimisé pour tenir sur 1 page
  const qrSize = 85; //  Réduction 90→85
  const qrX = dimensions.pageWidth - margins.right - qrSize - 20;
  const qrY = y;
  
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
       .text(PDF_TEXTS.receipt.qrText, qrX - 10, qrY + qrSize + 6, {
         width: qrSize + 20,
         align: 'center'
       });
  }
  
  // PIED DE PAGE avec signature
  drawFooter(doc, 1, 1, PDF_TEXTS.receipt.footer, ASSETS_PATH.signature);
}

/**
 
 * 2️⃣ TEMPLATE: LISTE DES TRANSACTIONS - AVEC SIGNATURE
 
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
    y += 25;
  }
  
  //  TABLEAU AVEC COLONNE "MEMBRE/ADHÉRENT"
  if (transactions.length > 0) {
    const headers = ['Réf.', 'Date', 'Membre', 'Catégorie', 'Type', 'Montant', 'Statut'];
    
    //  Largeurs ajustées pour ne pas dépasser
    const columnWidths = [55, 60, 95, 75, 50, 75, 55]; // Total = 465
    
    const rows = transactions.map(t => {
      //  Extraire le nom du membre
      const memberName = extractMemberName(t);
      
      return [
        t.reference,
        formatDate(t.transaction_date, 'short'),
        truncateText(memberName, 20),
        truncateText(t.category_name || 'N/A', 16),
        getTypeLabel(t.type).text,
        formatAmount(t.amount),
        getStatusLabel(t.status).text
      ];
    });
    
    y = drawTable(doc, headers, rows, y, { 
      columnWidths,
      fontSize: fonts.tiny,
      alignRight: [5] // Colonne "Montant"
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
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    // Signature uniquement sur dernière page
    const signature = (i === range.count - 1) ? ASSETS_PATH.signature : null;
    drawFooter(doc, i + 1, range.count, PDF_TEXTS.transactionList.footer, signature);
  }
}

/**
 
 *  TEMPLATE: RAPPORT FINANCIER 
 
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
  
  // RÉSUMÉ FINANCIER - 3 Encadrés
  const boxWidth = (dimensions.pageWidth - margins.left - margins.right - 40) / 3;
  let boxX = margins.left;
  const boxY = y;
  const boxHeight = 85;
  
  const financialBoxes = [
    {
      label: 'RECETTES',
      value: formatAmount(data.totalRecettes || 0),
      color: colors.success,
      icon: '↗'
    },
    {
      label: 'DÉPENSES',
      value: formatAmount(data.totalDepenses || 0),
      color: colors.danger,
      icon: '↘'
    },
    {
      label: 'SOLDE NET',
      value: formatAmount((data.totalRecettes || 0) - (data.totalDepenses || 0)),
      color: (data.totalRecettes - data.totalDepenses) >= 0 ? colors.success : colors.danger,
      icon: '='
    }
  ];
  
  financialBoxes.forEach((box) => {
    doc.rect(boxX, boxY, boxWidth, boxHeight)
       .fill(colors.bgLight);
    
    doc.rect(boxX, boxY, 5, boxHeight)
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
    
    doc.fontSize(24)
       .fillColor(box.color)
       .font('Helvetica-Bold')
       .text(box.icon, boxX + 15, boxY + 35, {
         width: boxWidth - 20,
         align: 'center'
       });
    
    doc.fontSize(fonts.heading)
       .text(box.value, boxX + 15, boxY + 55, {
         width: boxWidth - 20,
         align: 'center'
       });
    
    boxX += boxWidth + 20;
  });
  
  y = boxY + boxHeight + 30;
  
  // RÉPARTITION PAR CATÉGORIE
  if (data.byCategory && data.byCategory.length > 0) {
    doc.fontSize(fonts.subheading)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Répartition par Catégorie', margins.left, y); 
    
    y += 25;
    
    const headers = ['Catégorie', 'Type', 'Nb Trans.', 'Montant Total', '% du Total'];
    
    //  Largeurs ajustées
    const columnWidths = [165, 75, 75, 90, 70]; // Total = 475
    
    const grandTotal = data.byCategory.reduce((sum, cat) => 
      sum + parseFloat(cat.total_amount || 0), 0
    );
    
    const rows = data.byCategory.map(cat => {
      const amount = parseFloat(cat.total_amount || 0);
      const percentage = grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : '0';
      
      return [
        cat.category_name,
        getTypeLabel(cat.category_type).text,
        String(cat.transaction_count || 0),
        formatAmount(amount),
        `${percentage}%`
      ];
    });
    
    y = drawTable(doc, headers, rows, y, {
      columnWidths,
      alignRight: [2, 3, 4]
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
  
  // PIED DE PAGE avec signature
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count, PDF_TEXTS.financialReport.footer, ASSETS_PATH.signature);
  }
}

/**
 
 * 4️⃣ TEMPLATE: RELEVÉ MEMBRE
 
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
    const columnWidths = [100, 140, 90, 80, 115];
    
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
      alignRight: [2]
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
  
  // PIED DE PAGE
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count, PDF_TEXTS.memberStatement.footer);
  }
}

module.exports = {
  generateReceiptPDF,
  generateTransactionListPDF,
  generateFinancialReportPDF,
  generateMemberStatementPDF
};