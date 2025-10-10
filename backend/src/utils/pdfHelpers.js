/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Helpers

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

const QRCode = require('qrcode');
const { CLUB_INFO, PDF_CONFIG } = require('../config/pdfConfig');

/**
 * Formater un montant en FCFA
 */
const formatAmount = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(numAmount)) + ' FCFA';
};

/**
 * Formater une date
 */
const formatDate = (date, format = 'full') => {
  const d = new Date(date);
  
  if (format === 'full') {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (format === 'short') {
    return d.toLocaleDateString('fr-FR');
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('fr-FR');
  }
  
  return d.toLocaleDateString('fr-FR');
};

/**
 * Générer un QR Code
 */
const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      width: PDF_CONFIG.dimensions.qrCodeSize,
      margin: 1,
      color: {
        dark: CLUB_INFO.colors.primary,
        light: '#FFFFFF'
      }
    });
    return qrDataURL;
  } catch (error) {
    console.error('Erreur génération QR Code:', error);
    return null;
  }
};

/**
 * Dessiner l'en-tête du document
 */
const drawHeader = (doc, title, subtitle, logoPath) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  let y = margins.top;
  
  // Bande orange en haut
  doc.rect(0, 0, dimensions.pageWidth, 40)
     .fill(colors.primary);
  
  // Logo (si disponible)
  try {
    doc.image(logoPath, margins.left, y - 10, {
      width: dimensions.logoWidth,
      height: dimensions.logoHeight
    });
  } catch (error) {
    console.error('Logo non trouvé:', error.message);
  }
  
  // Informations du club à droite
  const rightX = dimensions.pageWidth - margins.right;
  doc.fontSize(fonts.heading)
     .fillColor(colors.text)
     .text(CLUB_INFO.name, margins.left + dimensions.logoWidth + 20, y, {
       width: rightX - (margins.left + dimensions.logoWidth + 20),
       align: 'right'
     });
  
  y += 20;
  doc.fontSize(fonts.small)
     .fillColor(colors.textLight)
     .text(CLUB_INFO.address, margins.left + dimensions.logoWidth + 20, y, {
       width: rightX - (margins.left + dimensions.logoWidth + 20),
       align: 'right'
     });
  
  y += 12;
  doc.text(CLUB_INFO.addressLine2, margins.left + dimensions.logoWidth + 20, y, {
       width: rightX - (margins.left + dimensions.logoWidth + 20),
       align: 'right'
     });
  
  y += 12;
  doc.text(`Tél: ${CLUB_INFO.phone} | Email: ${CLUB_INFO.email}`, 
           margins.left + dimensions.logoWidth + 20, y, {
       width: rightX - (margins.left + dimensions.logoWidth + 20),
       align: 'right'
     });
  
  y += 12;
  doc.fillColor(colors.primary)
     .text(CLUB_INFO.website, margins.left + dimensions.logoWidth + 20, y, {
       width: rightX - (margins.left + dimensions.logoWidth + 20),
       align: 'right',
       link: `https://${CLUB_INFO.website}`
     });
  
  // Ligne séparatrice
  y = margins.top + dimensions.logoHeight + 10;
  doc.moveTo(margins.left, y)
     .lineTo(dimensions.pageWidth - margins.right, y)
     .strokeColor(colors.primary)
     .lineWidth(2)
     .stroke();
  
  // Titre du document
  y += 30;
  doc.fontSize(fonts.title)
     .fillColor(colors.primary)
     .text(title, margins.left, y, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  // Sous-titre
  if (subtitle) {
    y += 25;
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .text(subtitle, margins.left, y, {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       });
  }
  
  return y + 30; // Retourner la position Y après l'en-tête
};

/**
 * Dessiner le pied de page
 */
const drawFooter = (doc, pageNumber, totalPages, footerText, signaturePath = null) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  const footerY = dimensions.pageHeight - margins.bottom - 60;
  
  // Signature (si fournie)
  if (signaturePath) {
    try {
      const signX = dimensions.pageWidth - margins.right - dimensions.signatureWidth - 20;
      const signY = footerY - dimensions.signatureHeight - 40;
      
      // Cadre pour signature
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .text('Le Chef de la Cellule Financière', signX, signY - 15, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      // Image de signature
      doc.image(signaturePath, signX + 10, signY, {
        width: dimensions.signatureWidth,
        height: dimensions.signatureHeight,
        fit: [dimensions.signatureWidth, dimensions.signatureHeight]
      });
      
      // Nom du signataire
      doc.fontSize(fonts.body)
         .fillColor(colors.text)
         .text(CLUB_INFO.signatory.name, signX, signY + dimensions.signatureHeight + 5, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
      
      doc.fontSize(fonts.small)
         .fillColor(colors.textLight)
         .text(CLUB_INFO.signatory.title, signX, signY + dimensions.signatureHeight + 20, {
           width: dimensions.signatureWidth + 20,
           align: 'center'
         });
    } catch (error) {
      console.error('Signature non trouvée:', error.message);
    }
  }
  
  // Ligne séparatrice
  doc.moveTo(margins.left, footerY)
     .lineTo(dimensions.pageWidth - margins.right, footerY)
     .strokeColor(colors.light)
     .lineWidth(1)
     .stroke();
  
  // Texte du pied de page
  doc.fontSize(fonts.tiny)
     .fillColor(colors.textLight)
     .text(footerText, margins.left, footerY + 10, {
       width: dimensions.pageWidth - margins.left - margins.right,
       align: 'center'
     });
  
  // Numéro de page
  doc.text(
    `Page ${pageNumber} sur ${totalPages}`,
    margins.left,
    footerY + 25,
    {
      width: dimensions.pageWidth - margins.left - margins.right,
      align: 'center'
    }
  );
  
  // Date et heure de génération
  const now = new Date();
  doc.fontSize(fonts.tiny)
     .text(
       `Généré le ${formatDate(now, 'short')} à ${formatDate(now, 'time')}`,
       margins.left,
       footerY + 35,
       {
         width: dimensions.pageWidth - margins.left - margins.right,
         align: 'center'
       }
     );
};

/**
 * Dessiner un tableau
 */
const drawTable = (doc, headers, rows, startY, options = {}) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts, dimensions } = PDF_CONFIG;
  
  const {
    columnWidths = null, // Si null, largeurs égales
    headerBg = colors.primary,
    headerTextColor = '#FFFFFF',
    rowBg1 = '#FFFFFF',
    rowBg2 = '#F9F9F9',
    borderColor = colors.light,
    fontSize = fonts.small,
    padding = 8
  } = options;
  
  let y = startY;
  const tableWidth = dimensions.pageWidth - margins.left - margins.right;
  
  // Calculer les largeurs de colonnes
  const colCount = headers.length;
  const colWidths = columnWidths || Array(colCount).fill(tableWidth / colCount);
  
  // En-têtes
  let x = margins.left;
  doc.fontSize(fonts.body).fillColor(headerTextColor);
  
  // Background des en-têtes
  doc.rect(margins.left, y, tableWidth, 25)
     .fill(headerBg);
  
  // Texte des en-têtes
  doc.fillColor(headerTextColor);
  headers.forEach((header, i) => {
    doc.text(header, x + padding, y + padding, {
      width: colWidths[i] - padding * 2,
      align: 'left'
    });
    x += colWidths[i];
  });
  
  y += 25;
  
  // Lignes du tableau
  doc.fontSize(fontSize).fillColor(colors.text);
  
  rows.forEach((row, rowIndex) => {
    x = margins.left;
    const rowHeight = 20;
    
    // Background alterné
    const bgColor = rowIndex % 2 === 0 ? rowBg1 : rowBg2;
    doc.rect(margins.left, y, tableWidth, rowHeight)
       .fill(bgColor);
    
    // Contenu des cellules
    doc.fillColor(colors.text);
    row.forEach((cell, cellIndex) => {
      doc.text(String(cell), x + padding, y + padding, {
        width: colWidths[cellIndex] - padding * 2,
        align: cellIndex === row.length - 1 ? 'right' : 'left', // Dernière colonne à droite
        ellipsis: true
      });
      x += colWidths[cellIndex];
    });
    
    y += rowHeight;
    
    // Vérifier si on doit créer une nouvelle page
    if (y > dimensions.pageHeight - margins.bottom - 100) {
      doc.addPage();
      y = margins.top;
    }
  });
  
  // Bordure finale
  doc.rect(margins.left, startY, tableWidth, y - startY)
     .strokeColor(borderColor)
     .lineWidth(0.5)
     .stroke();
  
  return y + 20; // Retourner la position Y après le tableau
};

/**
 * Dessiner une section d'informations
 */
const drawInfoSection = (doc, title, data, startY) => {
  const { colors } = CLUB_INFO;
  const { margins, fonts } = PDF_CONFIG;
  
  let y = startY;
  
  // Titre de section
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .text(title, margins.left, y);
  
  y += 20;
  
  // Données
  doc.fontSize(fonts.body)
     .fillColor(colors.text);
  
  Object.entries(data).forEach(([key, value]) => {
    doc.fillColor(colors.textLight)
       .text(`${key}:`, margins.left, y, { continued: true })
       .fillColor(colors.text)
       .text(` ${value}`);
    y += 18;
  });
  
  return y + 10;
};

/**
 * Dessiner une boîte de résumé
 */
const drawSummaryBox = (doc, items, x, y, width) => {
  const { colors } = CLUB_INFO;
  const { fonts } = PDF_CONFIG;
  
  const boxHeight = items.length * 25 + 20;
  
  // Fond
  doc.rect(x, y, width, boxHeight)
     .fill('#F9F9F9')
     .stroke(colors.light);
  
  let currentY = y + 10;
  
  items.forEach(item => {
    doc.fontSize(fonts.body)
       .fillColor(colors.textLight)
       .text(item.label, x + 15, currentY, { continued: true, width: width - 100 })
       .fillColor(item.color || colors.text)
       .text(item.value, { align: 'right', width: 80 });
    currentY += 25;
  });
  
  return y + boxHeight + 20;
};

module.exports = {
  formatAmount,
  formatDate,
  generateQRCode,
  drawHeader,
  drawFooter,
  drawTable,
  drawInfoSection,
  drawSummaryBox
};