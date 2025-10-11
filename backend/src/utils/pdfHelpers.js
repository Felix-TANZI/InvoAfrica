/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - PDF Helpers  */

const QRCode = require('qrcode');
const fs = require('fs');
const { CLUB_INFO, PDF_CONFIG, PDF_TEXTS } = require('../config/pdfConfig');

/**
 * FORMATAGE DES MONTANTS 
 */
const formatAmount = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/\s/g, '')) : amount;
  if (isNaN(numAmount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(Math.round(numAmount)).replace(/\s/g, ' ') + ' FCFA';
};

/**
 * Formater une date
 */
const formatDate = (date, format = 'full') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Date invalide';
  
  const options = {
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    datetime: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };
  
  return d.toLocaleDateString('fr-FR', options[format] || options.full);
};

/**
 * GÉNÉRATION QR CODE
 */
const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      width: PDF_CONFIG.dimensions.qrCodeSize * 3,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: CLUB_INFO.colors.primary,
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('❌ Erreur génération QR Code:', error);
    return null;
  }
};

/**
 *  Extraire le nom du membre
 */
const extractMemberName = (transaction) => {
  // Priorité 1 : contact_person
  if (transaction.contact_person) {
    return transaction.contact_person.trim();
  }
  
  // Priorité 2 : Extraire depuis description (format "Type mois année - NOM Prénom")
  if (transaction.description) {
    const parts = transaction.description.split(' - ');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
  }
  
  return '-';
};

/**
 * EN-TÊTE MODERNISÉ
 */
const drawHeader = (doc, title, subtitle, logoPath) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  let y = margins.top;
  
  // Bande bleue en haut
  doc.rect(0, 0, dimensions.pageWidth, 50)
     .fill(colors.primary);
  
  // Rectangle blanc pour le logo
  doc.rect(margins.left - 5, y - 15, dimensions.logoWidth + 10, dimensions.logoHeight + 10)
     .fillAndStroke('#FFFFFF', colors.border);
  
  // Logo
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, margins.left, y - 10, {
        width: dimensions.logoWidth,
        height: dimensions.logoHeight,
        fit: [dimensions.logoWidth, dimensions.logoHeight]
      });
    } catch (error) {
      console.warn('⚠️ Logo introuvable:', error.message);
    }
  }
  
  // Informations du club à droite
  const rightX = dimensions.pageWidth - margins.right;
  const infoX = margins.left + dimensions.logoWidth + 30;
  const infoWidth = rightX - infoX;
  
  doc.fontSize(fonts.heading)
     .fillColor(colors.text)
     .font('Helvetica-Bold')
     .text(CLUB_INFO.name, infoX, y, { width: infoWidth, align: 'right' });
  
  y += 20;
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .font('Helvetica')
     .text(CLUB_INFO.address, infoX, y, { width: infoWidth, align: 'right' });
  
  y += 12;
  doc.text(CLUB_INFO.addressLine2, infoX, y, { width: infoWidth, align: 'right' });
  
  y += 12;
  doc.fontSize(fonts.tiny)
     .text(`Tel: ${CLUB_INFO.phone}`, infoX, y, { width: infoWidth, align: 'right' });
  
  y += 10;
  doc.text(`Email: ${CLUB_INFO.email}`, infoX, y, { width: infoWidth, align: 'right' });
  
  y += 10;
  doc.fillColor(colors.primary)
     .fontSize(fonts.small)
     .text(`Web: ${CLUB_INFO.website}`, infoX, y, {
       width: infoWidth,
       align: 'right',
       link: `https://${CLUB_INFO.website}`,
       underline: true
     });
  
  // Double ligne séparatrice
  y = margins.top + dimensions.logoHeight + 15;
  
  doc.moveTo(margins.left, y)
     .lineTo(dimensions.pageWidth - margins.right, y)
     .strokeColor(colors.primary)
     .lineWidth(2)
     .stroke();
  
  doc.moveTo(margins.left, y + 3)
     .lineTo(dimensions.pageWidth - margins.right, y + 3)
     .strokeColor(colors.primaryLight)
     .lineWidth(1)
     .stroke();
  
  // Titre du document
  y += 25;
  const titleBoxY = y;
  const titleBoxHeight = subtitle ? 60 : 40;
  
  doc.rect(margins.left, titleBoxY, dimensions.pageWidth - margins.left - margins.right, titleBoxHeight)
     .fill(colors.bgBlueLight);
  
  y += 15;
  doc.fontSize(fonts.title)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(title, margins.left, y, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  if (subtitle) {
    y += 28;
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .font('Helvetica')
       .text(subtitle, margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  return titleBoxY + titleBoxHeight + 20;
};

/**
 * PIED DE PAGE AMÉLIORÉ
 */
const drawFooter = (doc, pageNumber, totalPages, footerText, signaturePath = null) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  const footerY = dimensions.pageHeight - margins.bottom - 10;
  
  // Signature (uniquement sur page 1)
  if (signaturePath && pageNumber === 1 && fs.existsSync(signaturePath)) {
    try {
      const signX = dimensions.pageWidth - margins.right - dimensions.signatureWidth - 20;
      const signY = footerY - dimensions.signatureHeight - 80;
      
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .font('Helvetica')
         .text('Certification', signX, signY - 20, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      doc.rect(signX - 5, signY - 5, dimensions.signatureWidth + 10, dimensions.signatureHeight + 10)
         .stroke(colors.border);
      
      doc.image(signaturePath, signX, signY, {
        width: dimensions.signatureWidth,
        height: dimensions.signatureHeight,
        fit: [dimensions.signatureWidth, dimensions.signatureHeight]
      });
      
      doc.fontSize(fonts.body)
         .fillColor(colors.text)
         .font('Helvetica-Bold')
         .text(CLUB_INFO.signatory.name, signX - 10, signY + dimensions.signatureHeight + 8, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .font('Helvetica')
         .text(CLUB_INFO.signatory.title, signX - 10, signY + dimensions.signatureHeight + 24, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      doc.fontSize(fonts.tiny)
         .text(`Fait à ${PDF_TEXTS.receipt.location}, le ${formatDate(new Date(), 'medium')}`, 
               signX - 10, signY + dimensions.signatureHeight + 38, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      doc.fontSize(fonts.tiny)
         .fillColor(colors.primary)
         .text(PDF_TEXTS.receipt.certification, 
               margins.left, signY + dimensions.signatureHeight + 20, {
           width: signX - margins.left - 40,
           align: 'left'
         });
    } catch (error) {
      console.warn('⚠️ Signature introuvable:', error.message);
    }
  }
  
  // Ligne séparatrice
  doc.moveTo(margins.left, footerY)
     .lineTo(dimensions.pageWidth - margins.right, footerY)
     .strokeColor(colors.border)
     .lineWidth(1)
     .stroke();
  
  // Texte du pied de page
  doc.fontSize(fonts.tiny)
     .fillColor(colors.textMuted)
     .font('Helvetica')
     .text(footerText, margins.left, footerY + 8, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  doc.fontSize(fonts.tiny)
     .text(`Page ${pageNumber} sur ${totalPages}`, margins.left, footerY + 20, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  const now = new Date();
  doc.text(`Généré le ${formatDate(now, 'short')} à ${formatDate(now, 'time')}`, 
           margins.left, footerY + 30, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
};

/**
 * TABLEAU AMÉLIORÉ
 */
const drawTable = (doc, headers, rows, startY, options = {}) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions, table } = PDF_CONFIG;
  
  const {
    columnWidths = null,
    headerBg = colors.primary,
    headerTextColor = '#FFFFFF',
    rowBg1 = colors.bgWhite,
    rowBg2 = colors.bgLight,
    borderColor = colors.border,
    fontSize = fonts.small,
    padding = table.padding,
    alignRight = []
  } = options;
  
  let y = startY;
  const tableWidth = dimensions.pageWidth - margins.left - margins.right;
  const colCount = headers.length;
  const colWidths = columnWidths || Array(colCount).fill(tableWidth / colCount);
  
  // EN-TÊTES
  let x = margins.left;
  doc.rect(margins.left, y, tableWidth, table.headerHeight)
     .fillAndStroke(headerBg, colors.borderDark);
  
  doc.fontSize(fonts.body)
     .fillColor(headerTextColor)
     .font('Helvetica-Bold');
     
  headers.forEach((header, i) => {
    const align = alignRight.includes(i) ? 'right' : 'left';
    doc.text(header, x + padding, y + (table.headerHeight - fonts.body) / 2, {
      width: colWidths[i] - padding * 2,
      align: align
    });
    x += colWidths[i];
  });
  
  y += table.headerHeight;
  
  // LIGNES
  doc.fontSize(fontSize)
     .fillColor(colors.text)
     .font('Helvetica');
  
  rows.forEach((row, rowIndex) => {
    x = margins.left;
    let maxHeight = table.rowHeight;
    
    // Nouvelle page si nécessaire
    if (y + maxHeight > dimensions.pageHeight - margins.bottom - 100) {
      doc.addPage();
      y = margins.top;
      
      // Redessiner en-tête
      x = margins.left;
      doc.rect(margins.left, y, tableWidth, table.headerHeight)
         .fillAndStroke(headerBg, colors.borderDark);
      
      doc.fontSize(fonts.body)
         .fillColor(headerTextColor)
         .font('Helvetica-Bold');
         
      headers.forEach((header, i) => {
        const align = alignRight.includes(i) ? 'right' : 'left';
        doc.text(header, x + padding, y + (table.headerHeight - fonts.body) / 2, {
          width: colWidths[i] - padding * 2,
          align: align
        });
        x += colWidths[i];
      });
      
      y += table.headerHeight;
      x = margins.left;
      
      doc.fontSize(fontSize)
         .fillColor(colors.text)
         .font('Helvetica');
    }
    
    // Background alterné
    const bgColor = rowIndex % 2 === 0 ? rowBg1 : rowBg2;
    doc.rect(margins.left, y, tableWidth, maxHeight)
       .fill(bgColor);
    
    doc.rect(margins.left, y, tableWidth, maxHeight)
       .stroke(borderColor);
    
    // Contenu cellules
    doc.fillColor(colors.text);
    row.forEach((cell, cellIndex) => {
      const align = alignRight.includes(cellIndex) ? 'right' : 'left';
      const cellText = cell === null || cell === undefined ? '' : String(cell);
      
      doc.text(cellText, x + padding, y + padding, {
        width: colWidths[cellIndex] - padding * 2,
        align: align,
        lineBreak: true,
        height: maxHeight - padding * 2,
        ellipsis: false
      });
      
      if (cellIndex < row.length - 1) {
        doc.moveTo(x + colWidths[cellIndex], y)
           .lineTo(x + colWidths[cellIndex], y + maxHeight)
           .stroke(borderColor);
      }
      
      x += colWidths[cellIndex];
    });
    
    y += maxHeight;
  });
  
  doc.rect(margins.left, startY, tableWidth, y - startY)
     .stroke(colors.borderDark);
  
  return y + 20;
};

/**
 * SECTION D'INFORMATIONS
 */
const drawInfoSection = (doc, title, data, startY, options = {}) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  const { bordered = true, bgColor = colors.bgLight } = options;
  
  let y = startY;
  const contentWidth = dimensions.pageWidth - margins.left - margins.right;
  
  if (bordered) {
    const sectionHeight = Object.keys(data).length * 20 + 40;
    doc.rect(margins.left, y, contentWidth, sectionHeight)
       .fillAndStroke(bgColor, colors.border);
    y += 12;
  }
  
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(title, margins.left + 10, y);
  
  y += 25;
  
  doc.fontSize(fonts.body)
     .fillColor(colors.text)
     .font('Helvetica');
  
  const entries = Object.entries(data);
  const midPoint = Math.ceil(entries.length / 2);
  const leftCol = margins.left + 15;
  const rightCol = dimensions.pageWidth / 2 + 10;
  
  entries.forEach(([key, value], index) => {
    const x = index < midPoint ? leftCol : rightCol;
    const localY = index < midPoint ? y + (index * 18) : y + ((index - midPoint) * 18);
    
    doc.fillColor(colors.textLight)
       .font('Helvetica')
       .text(`${key}:`, x, localY, { width: 100, continued: true })
       .fillColor(colors.text)
       .font('Helvetica-Bold')
       .text(` ${value}`, { width: 150 });
  });
  
  return y + Math.max(midPoint, entries.length - midPoint) * 18 + 20;
};

/**
 * BOÎTE DE RÉSUMÉ
 */
const drawSummaryBox = (doc, items, x, y, width, options = {}) => {
  const { colors } = CLUB_INFO;
  const { fonts } = PDF_CONFIG;
  const { title = 'Résumé', layout = 'horizontal' } = options;
  
  const boxHeight = layout === 'horizontal' ? 80 : items.length * 35 + 30;
  
  doc.rect(x, y, width, boxHeight)
     .fill(colors.bgLight);
  
  doc.rect(x, y, width, boxHeight)
     .stroke(colors.primary);
  
  doc.rect(x, y, width, 5)
     .fill(colors.primary);
  
  let currentY = y + 15;
  
  if (title) {
    doc.fontSize(fonts.subheading)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(title, x + 15, currentY, { width: width - 30 });
    currentY += 25;
  }
  
  if (layout === 'horizontal') {
    const itemWidth = (width - 40) / items.length;
    let itemX = x + 20;
    
    items.forEach((item, index) => {
      if (index > 0) {
        doc.moveTo(itemX - 10, currentY - 5)
           .lineTo(itemX - 10, currentY + 35)
           .stroke(colors.border);
      }
      
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .font('Helvetica')
         .text(item.label, itemX, currentY, { width: itemWidth - 10, align: 'center' });
      
      doc.fontSize(fonts.heading)
         .fillColor(item.color || colors.text)
         .font('Helvetica-Bold')
         .text(item.value, itemX, currentY + 18, { width: itemWidth - 10, align: 'center' });
      
      itemX += itemWidth;
    });
  } else {
    items.forEach((item, index) => {
      doc.fontSize(fonts.body)
         .fillColor(colors.textLight)
         .font('Helvetica')
         .text(item.label, x + 20, currentY, { width: width - 140, continued: true });
      
      doc.fillColor(item.color || colors.text)
         .font('Helvetica-Bold')
         .text(item.value, { align: 'right', width: 100 });
      
      currentY += 30;
      
      if (index < items.length - 1) {
        doc.moveTo(x + 20, currentY - 5)
           .lineTo(x + width - 20, currentY - 5)
           .stroke(colors.border);
      }
    });
  }
  
  return y + boxHeight + 20;
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

module.exports = {
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
};