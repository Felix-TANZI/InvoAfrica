/* Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.5 - PDF Helpers FINAL (Esthétique Corrigée) */

const QRCode = require('qrcode');
const fs = require('fs');
const { CLUB_INFO, PDF_CONFIG, PDF_TEXTS } = require('../config/pdfConfig');
const moment = require('moment'); 
moment.locale('fr');

/**
 * FORMATAGE DES MONTANTS 
 */
const formatAmount = (amount) => {
  const numAmount = typeof amount === 'string' ? parseFloat(String(amount).replace(/[\s,]/g, '')) : amount;
  if (isNaN(numAmount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(Math.round(numAmount)).replace(/[\s,]/g, ' ') + ' FCFA';
};

/**
 * Formater une date (Utilisation de moment.js)
 */
const formatDate = (date, format = 'full') => {
  if (!date) return 'N/A';
  
  const m = moment(date);
  if (!m.isValid()) return 'Date invalide';

  switch (format) {
    case 'full':
      return m.format('dddd D MMMM YYYY');
    case 'short':
      return m.format('DD/MM/YYYY');
    case 'medium':
      return m.format('D MMMM YYYY');
    case 'fullDateWithTime':
      return m.format('DD/MM/YYYY à HH:mm:ss');
    default:
      return m.format('DD/MM/YYYY');
  }
};

/**
 * Générer un QR Code en Base64
 */
const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('Erreur de génération de QR Code', err);
    return null;
  }
};

/**
 * Dessiner l'en-tête du document
 */
const drawHeader = (doc, title, subtitle, logoPath) => {
  const { margins, fonts, dimensions } = PDF_CONFIG;
  const { colors, name, address, addressLine2, phone, email, website } = CLUB_INFO;
  
  const logoWidth = dimensions.logoWidth || 70;
  const infoX = dimensions.pageWidth - margins.right;
  const infoWidth = 200; 
  const headerYStart = margins.top - 50;
  
  // LOGO (colonne de gauche)
  try {
      if (logoPath && fs.existsSync(logoPath)) {
        doc.image(logoPath, margins.left, headerYStart, {
          width: logoWidth
        });
      }
  } catch(e) { /* Gérer l'erreur si l'image est introuvable */ }
  
  // INFORMATIONS DU CLUB (colonne de droite - Alignement à droite)
  doc.fontSize(fonts.small)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(name, infoX - infoWidth, headerYStart, { align: 'right', width: infoWidth });
     
  const contactInfo = `Tel: ${phone} | Email: ${email} | Web: ${website}`;

  doc.fontSize(fonts.tiny)
     .fillColor(colors.textMuted)
     .font('Helvetica')
     .text(address, infoX - infoWidth, headerYStart + 12, { align: 'right', width: infoWidth })
     .text(addressLine2, infoX - infoWidth, headerYStart + 20, { align: 'right', width: infoWidth })
     .text(contactInfo, infoX - infoWidth, headerYStart + 28, { align: 'right', width: infoWidth });

  // LIGNE DE SÉPARATION (En bas de l'en-tête)
  doc.strokeColor(colors.borderDark)
     .lineWidth(1)
     .moveTo(margins.left, margins.top)
     .lineTo(dimensions.pageWidth - margins.right, margins.top)
     .stroke();
  
  let y = margins.top + 10;
  
  // TITRE
  doc.fontSize(fonts.title)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(title, margins.left, y, { align: 'left' });
  
  y += 28;
  
  // SOUS-TITRE
  doc.fontSize(fonts.subheading)
     .fillColor(colors.textLight)
     .font('Helvetica-Oblique')
     .text(subtitle, margins.left, y, { align: 'left' });
     
  return y + 25; // Retourne la coordonnée Y après l'en-tête
};

/**
 * Dessiner le pied de page
 */
const drawFooter = (doc, currentPage, totalPages, footerText, signaturePath) => {
  const { margins, fonts, dimensions } = PDF_CONFIG;
  const { colors, signatory } = CLUB_INFO;
  
  const footerY = dimensions.pageHeight - margins.bottom;
  
  // LIGNE DE SÉPARATION
  doc.strokeColor(colors.borderDark)
     .lineWidth(1)
     .moveTo(margins.left, footerY - 5)
     .lineTo(dimensions.pageWidth - margins.right, footerY - 5)
     .stroke();
  
  // ZONE DE TEXTE GAUCHE (texte du footer)
  doc.fontSize(fonts.small)
     .fillColor(colors.textMuted)
     .font('Helvetica-Oblique')
     .text(footerText, margins.left, footerY + 5, {
       width: dimensions.pageWidth / 2 - margins.left,
       align: 'left'
     });
     
  // Date de génération (alignée à droite)
  const dateText = `Généré le ${formatDate(new Date(), 'fullDateWithTime')}`;
  doc.text(dateText, dimensions.pageWidth / 2, footerY + 5, {
      width: dimensions.pageWidth / 2 - margins.right,
      align: 'right'
  });
  
  // NUMÉRO DE PAGE (Centre)
  doc.fontSize(fonts.small)
     .fillColor(colors.textMuted)
     .font('Helvetica')
     .text(`Page ${currentPage} sur ${totalPages}`, 0, footerY + 5, {
       align: 'center',
       width: dimensions.pageWidth
     });
     
  // SECTION SIGNATURE
  if (signaturePath) {
    const signatureY = footerY - 100; 
    const signatureWidth = dimensions.signatureWidth || 100;
    const signatureHeight = dimensions.signatureHeight || 40;
    const signatureX = dimensions.pageWidth - margins.right - signatureWidth - 10;
    
    // IMAGE DE SIGNATURE
    try {
      if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, signatureX, signatureY, {
          width: signatureWidth,
          height: signatureHeight
        });
      } else {
         doc.rect(signatureX, signatureY, signatureWidth, signatureHeight)
            .stroke(colors.danger)
            .fill(colors.bgLight);
         doc.fillColor(colors.danger)
            .fontSize(fonts.tiny)
            .text('Signature absente', signatureX, signatureY + signatureHeight / 2 - 5, { align: 'center', width: signatureWidth });
      }
    } catch (error) {
       console.error("Erreur de rendu de la signature:", error);
    }
    
    // Nom et Titre du Signataire
    doc.fillColor(colors.text)
       .font('Helvetica')
       .fontSize(fonts.small)
       .text(signatory.name, signatureX, signatureY + signatureHeight + 5, { align: 'center', width: signatureWidth });
    
    doc.fontSize(fonts.tiny)
       .text(signatory.title, signatureX, signatureY + signatureHeight + 15, { align: 'center', width: signatureWidth });
  }
};


/**
 * Dessiner une section d'informations (clés/valeurs)
 */
const drawInfoSection = (doc, title, infoMap, startY, options = {}) => {
  const { margins, fonts, dimensions } = PDF_CONFIG;
  const { colors } = CLUB_INFO;
  const defaultOptions = { 
    bordered: false, 
    bgColor: colors.bgLight, 
    keyColor: colors.textLight, 
    valueColor: colors.text 
  };
  const finalOptions = { ...defaultOptions, ...options };
  
  const width = dimensions.pageWidth - margins.left - margins.right;
  let currentY = startY;
  
  // Titre de la section
  doc.fontSize(fonts.subheading)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text(title, margins.left, currentY);
     
  currentY += 18;
  
  const colCount = 2; // Toujours 2 colonnes pour l'info
  const colWidth = width / colCount;
  const lineHeight = fonts.body + 5;
  
  // Calculer la hauteur totale nécessaire pour le fond
  const keys = Object.keys(infoMap);
  const totalRows = Math.ceil(keys.length / colCount);
  const contentHeight = totalRows * lineHeight + 15;
  
  if (finalOptions.bordered) {
    doc.rect(margins.left, currentY - 5, width, contentHeight)
       .fillAndStroke(finalOptions.bgColor, colors.border);
  }
  
  let leftY = currentY + 5;
  let rightY = currentY + 5;
  
  keys.forEach((key, index) => {
    const value = infoMap[key];
    
    const isLeftColumn = index % colCount === 0;
    const yPosition = isLeftColumn ? leftY : rightY;
    const xStart = isLeftColumn ? margins.left : margins.left + colWidth;
    const padding = 10;
    
    doc.fillColor(finalOptions.keyColor)
         .font('Helvetica')
         .fontSize(fonts.body)
         .text(`${key}:`, xStart + padding, yPosition, { width: 100, continued: false });
         
    doc.fillColor(finalOptions.valueColor)
       .font('Helvetica-Bold')
       .text(value, xStart + 115, yPosition, { width: colWidth - 125 });
         
    if (isLeftColumn) {
      leftY += lineHeight;
    } else {
      rightY += lineHeight;
    }
  });
  
  return currentY + contentHeight + 15; 
};


/**
 * Dessiner un encadré de résumé (statistiques)
 * AMÉLIORATION: Design simplifié sans symboles Unicode qui posent problème.
 */
const drawSummaryBox = (doc, items, x, y, width, options = {}) => {
  const { fonts } = PDF_CONFIG;
  const { colors } = CLUB_INFO;
  const defaultOptions = { 
    title: 'Résumé', 
    layout: 'horizontal', 
    titleColor: colors.primary,
    bgColor: colors.bgLight,
    borderColor: colors.border
  };
  const finalOptions = { ...defaultOptions, ...options };

  let currentY = y;
  
  // Dessiner le fond (horizontal)
  if (finalOptions.layout === 'horizontal') {
    const boxHeight = 70;
    doc.rect(x, currentY - 5, width, boxHeight)
       .fillAndStroke(finalOptions.bgColor, finalOptions.borderColor);
    
    const itemWidth = width / items.length;
    let itemX = x;
    
    items.forEach((item, index) => {
      const labelColor = item.color || colors.textLight;

      if (index > 0) {
        // Ligne de séparation verticale
        doc.moveTo(itemX, currentY - 5)
           .lineTo(itemX, currentY + boxHeight - 5)
           .stroke(colors.border);
      }
      
      // Label: centré sur le quart supérieur
      doc.fontSize(fonts.small)
         .fillColor(labelColor)
         .font('Helvetica')
         .text(item.label, itemX + 10, currentY + 12, { width: itemWidth - 20, align: 'center' });
      
      // Valeur: centré sur le quart inférieur
      doc.fontSize(fonts.heading)
         .fillColor(item.color || colors.text)
         .font('Helvetica-Bold')
         // Suppression de item.icon ici pour éviter les symboles bizarres
         .text(item.value, itemX + 10, currentY + 33, { width: itemWidth - 20, align: 'center' });
      
      itemX += itemWidth;
    });
    
    return currentY + boxHeight + 15;
    
  } else {
    // Layout vertical
    return currentY + 10;
  }
};


/**
 * Dessiner un tableau
 */
const drawTable = (doc, headers, rows, startY, options = {}) => {
  const { margins, fonts, dimensions, table } = PDF_CONFIG;
  const { colors } = CLUB_INFO;
  
  const defaultOptions = { 
    columnWidths: [],
    fontSize: fonts.body,
    alignRight: [],
    alignCenter: [],
    ...table 
  };
  const finalOptions = { ...defaultOptions, ...options };
  
  const tableWidth = finalOptions.columnWidths.reduce((sum, w) => sum + w, 0);
  const startX = margins.left + (dimensions.pageWidth - margins.left - margins.right - tableWidth) / 2;
  let currentY = startY;
  
  const headerHeight = finalOptions.headerHeight;

  // --- FONCTION DE REDESSIN DE L'EN-TÊTE ---
  const drawTableHeaders = (y) => {
      doc.rect(startX, y, tableWidth, headerHeight)
         .fillAndStroke(colors.primaryLight, colors.borderDark);
         
      let currentX = startX;
      doc.fontSize(finalOptions.fontSize)
         .fillColor(colors.primary)
         .font('Helvetica-Bold');
         
      headers.forEach((header, index) => {
        const colWidth = finalOptions.columnWidths[index];
        doc.text(header, currentX + finalOptions.padding, y + finalOptions.padding, {
          width: colWidth - finalOptions.padding * 2,
          align: finalOptions.alignCenter.includes(index) ? 'center' : (finalOptions.alignRight.includes(index) ? 'right' : 'left'),
        });
        
        // Bordures verticales
        if (index < headers.length - 1) {
          doc.strokeColor(colors.borderDark)
             .lineWidth(finalOptions.borderWidth)
             .moveTo(currentX + colWidth, y)
             .lineTo(currentX + colWidth, y + headerHeight)
             .stroke();
        }
        currentX += colWidth;
      });
      return y + headerHeight;
  };
  
  // Dessiner l'en-tête initial
  currentY = drawTableHeaders(currentY);
  
  // --- LIGNES DE DONNÉES ---
  doc.fontSize(finalOptions.fontSize)
     .fillColor(colors.text)
     .font('Helvetica');
     
  rows.forEach((row, i) => {
    // 1. Calculer la hauteur de ligne 
    let maxHeight = finalOptions.rowHeight;
    
    if (finalOptions.rowHeightAuto) {
        maxHeight = row.reduce((maxH, cellText, cellIndex) => {
            const cellWidth = finalOptions.columnWidths[cellIndex] - finalOptions.padding * 2;
            
            const requiredHeight = doc.heightOfString(String(cellText), {
                width: cellWidth,
                align: finalOptions.alignCenter.includes(cellIndex) ? 'center' : (finalOptions.alignRight.includes(cellIndex) ? 'right' : 'left'),
            });
            
            return Math.max(maxH, requiredHeight + finalOptions.padding * 2); 
        }, maxHeight); 
    }

    // 2. Vérifier le saut de page
    if (currentY + maxHeight > dimensions.pageHeight - margins.bottom - headerHeight) { 
      doc.addPage();
      currentY = margins.top;
      currentY = drawTableHeaders(currentY); 
    }
    
    // 3. Remplissage et Dessin du Contenu
    const rowColor = (finalOptions.alternateRows && i % 2 === 0) ? colors.bgLight : colors.bgWhite;
    doc.rect(startX, currentY, tableWidth, maxHeight)
       .fill(rowColor);
       
    let currentX = startX;
    
    row.forEach((cellText, index) => {
      const colWidth = finalOptions.columnWidths[index];
      const textX = currentX + finalOptions.padding;
      const textY = currentY + finalOptions.padding;
      
      // Réinitialiser les styles
      doc.fillColor(colors.text)
         .font('Helvetica');
      
      // Styles pour Statut/Cotisation/Abonnement
      if (headers[index].includes('Statut') || headers[index].includes('Cotisation') || headers[index].includes('Abonnement')) {
          const statusText = String(cellText).replace(/[✓✗]/g, '').trim();
          const colorMap = { 
              'Payée': colors.success, 'Payé': colors.success, 
              'Validée': colors.success,
              'Avance': colors.warning, 
              'En attente': colors.danger, 
              'Annulée': colors.danger,
              'Inactif': colors.textLight,
              'Actif': colors.success 
          };
          const statusColor = colorMap[statusText] || colors.text;
          
          doc.fillColor(statusColor)
             .font('Helvetica-Bold');
      } else if (finalOptions.alignRight.includes(index)) {
        // Style pour les montants (à droite)
         doc.font('Helvetica-Bold');
      }

      doc.text(String(cellText), textX, textY, {
        width: colWidth - finalOptions.padding * 2,
        align: finalOptions.alignCenter.includes(index) ? 'center' : (finalOptions.alignRight.includes(index) ? 'right' : 'left'),
      });
      
      // Bordures verticales
      if (index < headers.length - 1) {
        doc.strokeColor(colors.borderDark)
           .lineWidth(finalOptions.borderWidth)
           .moveTo(currentX + colWidth, currentY)
           .lineTo(currentX + colWidth, currentY + maxHeight)
           .stroke();
      }
      
      currentX += colWidth;
    });
    
    // Bordure horizontale (bas de ligne)
    doc.strokeColor(colors.borderDark)
       .lineWidth(finalOptions.borderWidth)
       .moveTo(startX, currentY + maxHeight)
       .lineTo(startX + tableWidth, currentY + maxHeight)
       .stroke();
       
    currentY += maxHeight;
  });
  
  return currentY; 
};


/**
 * Tronquer une chaîne de caractères
 */
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return String(text).length > maxLength ? String(text).substring(0, maxLength - 3) + '...' : String(text);
};

/**
 * Extraire le nom du membre pour les transactions
 */
const extractMemberName = (transaction) => {
  if (transaction.member_name) return transaction.member_name;
  if (transaction.adherent_name) return transaction.adherent_name;
  return 'N/A';
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