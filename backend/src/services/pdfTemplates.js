/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Templates

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const { 
  CLUB_INFO, 
  ASSETS_PATH, 
  PDF_CONFIG, 
  PDF_TEXTS,
  STATUS_LABELS,
  TYPE_LABELS,
  PAYMENT_MODE_LABELS
} = require('../config/pdfConfig');

const {
  formatAmount,
  formatDate,
  generateQRCode,
  drawHeader,
  drawFooter,
  drawTable,
  drawInfoSection,
  drawSummaryBox
} = require('../utils/pdfHelpers');

/**
 * 1. TEMPLATE: Reçu de Transaction
 */
async function generateReceiptPDF(doc, transaction) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // En-tête
  let y = drawHeader(
    doc, 
    PDF_TEXTS.receipt.title, 
    PDF_TEXTS.receipt.subtitle,
    ASSETS_PATH.logo
  );
  
  // Numéro de référence en grand
  y += 20;
  doc.fontSize(fonts.heading)
     .fillColor(colors.primary)
     .text(`N° ${transaction.reference}`, margins.left, y, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  y += 40;
  
  // Section informations de base
  const leftCol = margins.left;
  const rightCol = dimensions.pageWidth / 2 + 20;
  
  // Colonne gauche - Informations transaction
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .text('Informations de la transaction', leftCol, y);
  
  y += 25;
  doc.fontSize(fonts.body).fillColor(colors.text);
  
  const leftInfo = {
    'Date': formatDate(transaction.transaction_date),
    'Type': TYPE_LABELS[transaction.type] || transaction.type,
    'Catégorie': transaction.category_name || 'N/A',
    'Mode de paiement': PAYMENT_MODE_LABELS[transaction.payment_mode] || transaction.payment_mode
  };
  
  Object.entries(leftInfo).forEach(([key, value]) => {
    doc.fillColor(colors.textLight)
       .text(`${key}:`, leftCol, y, { width: 120, continued: true })
       .fillColor(colors.text)
       .text(value, { width: 200 });
    y += 20;
  });
  
  // Colonne droite - Montant en grand
  const rightY = y - 80;
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .text('Montant', rightCol, rightY, { width: 250, align: 'center' });
  
  doc.fontSize(24)
     .fillColor(transaction.type === 'recette' ? colors.success : colors.danger)
     .text(formatAmount(transaction.amount), rightCol, rightY + 20, {
       width: 250,
       align: 'center'
     });
  
  // Statut
  doc.fontSize(fonts.body)
     .fillColor(colors.textLight)
     .text('Statut', rightCol, rightY + 55, { width: 250, align: 'center' });
  
  const statusColor = transaction.status === 'validee' ? colors.success : 
                     transaction.status === 'en_attente' ? '#f59e0b' : colors.danger;
  
  doc.fontSize(fonts.subheading)
     .fillColor(statusColor)
     .text(STATUS_LABELS[transaction.status] || transaction.status, rightCol, rightY + 72, {
       width: 250,
       align: 'center'
     });
  
  y += 20;
  
  // Description
  y += 20;
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .text('Description', margins.left, y);
  
  y += 20;
  doc.fontSize(fonts.body)
     .fillColor(colors.text)
     .text(transaction.description || 'Aucune description', margins.left, y, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'justify'
     });
  
  y += 60;
  
  // Contact et notes (si disponibles)
  if (transaction.contact_person) {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .text('Contact:', margins.left, y, { continued: true })
       .fillColor(colors.text)
       .text(` ${transaction.contact_person}`);
    y += 20;
  }
  
  if (transaction.notes) {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .text('Notes:', margins.left, y, { continued: true })
       .fillColor(colors.text)
       .text(` ${transaction.notes}`);
    y += 20;
  }
  
  // Informations de validation (si validée)
  if (transaction.status === 'validee' && transaction.validated_by_name) {
    y += 20;
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .text(`Validée par ${transaction.validated_by_name}`, margins.left, y);
    
    if (transaction.validated_at) {
      y += 15;
      doc.text(`Le ${formatDate(transaction.validated_at)}`, margins.left, y);
    }
  }
  
  // QR Code de vérification
  y += 40;
  const qrData = `${process.env.FRONTEND_URL || 'https://gi-enspy.com'}/transactions/${transaction.id}`;
  const qrCode = await generateQRCode(qrData);
  
  if (qrCode) {
    const qrX = dimensions.pageWidth - margins.right - PDF_CONFIG.dimensions.qrCodeSize - 20;
    doc.image(qrCode, qrX, y, {
      width: PDF_CONFIG.dimensions.qrCodeSize,
      height: PDF_CONFIG.dimensions.qrCodeSize
    });
    
    doc.fontSize(fonts.tiny)
       .fillColor(colors.textLight)
       .text(PDF_TEXTS.receipt.qrText, qrX, y + PDF_CONFIG.dimensions.qrCodeSize + 5, {
         width: PDF_CONFIG.dimensions.qrCodeSize,
         align: 'center'
       });
  }
  
  // Pied de page avec signature
  drawFooter(doc, 1, 1, PDF_TEXTS.receipt.footer, ASSETS_PATH.signature);
}

/**
 * 2. TEMPLATE: Liste des Transactions
 */
async function generateTransactionListPDF(doc, transactions, filters, statistics) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // Construire le sous-titre avec les filtres
  let subtitle = `Export du ${formatDate(new Date())}`;
  if (filters.date_from || filters.date_to) {
    subtitle += ` • Période: ${filters.date_from ? formatDate(filters.date_from, 'short') : '...'} au ${filters.date_to ? formatDate(filters.date_to, 'short') : '...'}`;
  }
  
  // En-tête
  let y = drawHeader(
    doc,
    PDF_TEXTS.transactionList.title,
    subtitle,
    ASSETS_PATH.logo
  );
  
  // Statistiques en haut
  if (statistics && Object.keys(statistics).length > 0) {
    const statsY = y;
    const colWidth = (dimensions.pageWidth - margins.left - margins.right - 30) / 4;
    let statsX = margins.left;
    
    // 4 boîtes de stats
    const statsBoxes = [
      { label: 'Total', value: statistics.total || 0, color: colors.text },
      { label: 'Recettes', value: formatAmount(statistics.montant_recettes || 0), color: colors.success },
      { label: 'Dépenses', value: formatAmount(statistics.montant_depenses || 0), color: colors.danger },
      { label: 'Solde', value: formatAmount(statistics.solde || 0), color: statistics.solde >= 0 ? colors.success : colors.danger }
    ];
    
    statsBoxes.forEach(stat => {
      doc.rect(statsX, statsY, colWidth, 50)
         .fill('#F9F9F9')
         .stroke(colors.light);
      
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .text(stat.label, statsX, statsY + 10, { width: colWidth, align: 'center' });
      
      doc.fontSize(fonts.heading)
         .fillColor(stat.color)
         .text(String(stat.value), statsX, statsY + 25, { width: colWidth, align: 'center' });
      
      statsX += colWidth + 10;
    });
    
    y = statsY + 70;
  }
  
  // Filtres appliqués
  if (filters && Object.keys(filters).some(key => filters[key])) {
    doc.fontSize(fonts.small)
       .fillColor(colors.textLight)
       .text('Filtres appliqués:', margins.left, y);
    
    y += 15;
    let filterText = [];
    if (filters.status) filterText.push(`Statut: ${STATUS_LABELS[filters.status]}`);
    if (filters.type) filterText.push(`Type: ${TYPE_LABELS[filters.type]}`);
    if (filters.category_id) filterText.push(`Catégorie: ${filters.category_name || filters.category_id}`);
    
    doc.text(filterText.join(' • '), margins.left, y);
    y += 25;
  }
  
  // Tableau des transactions
  if (transactions.length > 0) {
    const headers = ['Réf.', 'Date', 'Description', 'Catégorie', 'Type', 'Montant', 'Statut'];
    const columnWidths = [70, 70, 140, 90, 60, 80, 65];
    
    const rows = transactions.map(t => [
      t.reference,
      formatDate(t.transaction_date, 'short'),
      t.description.length > 30 ? t.description.substring(0, 27) + '...' : t.description,
      t.category_name || 'N/A',
      TYPE_LABELS[t.type] || t.type,
      formatAmount(t.amount),
      STATUS_LABELS[t.status] || t.status
    ]);
    
    y = drawTable(doc, headers, rows, y, { columnWidths, fontSize: fonts.tiny });
  } else {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .text('Aucune transaction trouvée', margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  // Pied de page
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count, PDF_TEXTS.transactionList.footer);
  }
}

/**
 * 3. TEMPLATE: Rapport Financier
 */
async function generateFinancialReportPDF(doc, data) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // En-tête
  let y = drawHeader(
    doc,
    PDF_TEXTS.financialReport.title,
    `Période: ${data.period || 'Non spécifiée'}`,
    ASSETS_PATH.logo
  );
  
  // Résumé financier
  const summaryItems = [
    { label: 'Total Recettes', value: formatAmount(data.totalRecettes || 0), color: colors.success },
    { label: 'Total Dépenses', value: formatAmount(data.totalDepenses || 0), color: colors.danger },
    { label: 'Solde Final', value: formatAmount((data.totalRecettes || 0) - (data.totalDepenses || 0)), color: colors.primary }
  ];
  
  y = drawSummaryBox(doc, summaryItems, margins.left, y, dimensions.pageWidth - margins.left - margins.right);
  
  // Répartition par catégorie
  if (data.byCategory && data.byCategory.length > 0) {
    doc.fontSize(fonts.subheading)
       .fillColor(colors.primary)
       .text('Répartition par catégorie', margins.left, y);
    
    y += 25;
    
    const headers = ['Catégorie', 'Type', 'Nombre', 'Montant Total'];
    const rows = data.byCategory.map(cat => [
      cat.category_name,
      TYPE_LABELS[cat.category_type] || cat.category_type,
      cat.transaction_count,
      formatAmount(cat.total_amount)
    ]);
    
    y = drawTable(doc, headers, rows, y);
  }
  
  // Pied de page avec signature
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, i + 1, range.count, PDF_TEXTS.financialReport.footer, ASSETS_PATH.signature);
  }
}

/**
 * 4. TEMPLATE: Relevé Membre
 */
async function generateMemberStatementPDF(doc, member, contributions) {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  doc.addPage();
  
  // En-tête
  let y = drawHeader(
    doc,
    PDF_TEXTS.memberStatement.title,
    `Membre: ${member.name}`,
    ASSETS_PATH.logo
  );
  
  // Informations du membre
  const memberInfo = {
    'Nom': member.name,
    'Email': member.email || 'N/A',
    'Téléphone': member.phone || 'N/A',
    'Statut': member.status || 'Actif'
  };
  
  y = drawInfoSection(doc, 'Informations du membre', memberInfo, y);
  
  // Résumé des cotisations
  const totalPaid = contributions.filter(c => c.status === 'paid').reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const totalPending = contributions.filter(c => c.status === 'pending').reduce((sum, c) => sum + parseFloat(c.amount), 0);
  
  const summaryItems = [
    { label: 'Total Payé', value: formatAmount(totalPaid), color: colors.success },
    { label: 'En Attente', value: formatAmount(totalPending), color: '#f59e0b' },
    { label: 'Total', value: formatAmount(totalPaid + totalPending), color: colors.text }
  ];
  
  y = drawSummaryBox(doc, summaryItems, margins.left, y, dimensions.pageWidth - margins.left - margins.right);
  
  // Tableau des cotisations
  if (contributions.length > 0) {
    const headers = ['Date', 'Type', 'Montant', 'Statut', 'Référence'];
    const rows = contributions.map(c => [
      formatDate(c.date, 'short'),
      c.type || 'Cotisation',
      formatAmount(c.amount),
      c.status === 'paid' ? 'Payée' : 'En attente',
      c.reference || 'N/A'
    ]);
    
    y = drawTable(doc, headers, rows, y);
  }
  
  // Pied de page
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