/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Export Buttons

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { Download, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import pdfAPI from '../../services/pdfAPI';
import toast from 'react-hot-toast';
import './PdfExportButtons.css';

const PdfExportButtons = ({ 
  variant = 'transaction-list', // 'transaction-list', 'receipt', 'financial-report', 'member-statement'
  transactionId = null,
  memberId = null,
  filters = {},
  reportOptions = {}
}) => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Télécharger un reçu de transaction
   */
  const handleDownloadReceipt = async () => {
    if (!transactionId) {
      toast.error('ID de transaction manquant');
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Génération du reçu en cours...');
    
    try {
      await pdfAPI.downloadReceipt(transactionId);
      toast.success('Reçu téléchargé avec succès !', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Exporter la liste des transactions
   */
  const handleExportList = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Génération du PDF en cours...');
    
    try {
      await pdfAPI.exportTransactionsList(filters);
      toast.success('Export réussi !', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'export', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Télécharger un rapport financier
   */
  const handleDownloadReport = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Génération du rapport en cours...');
    
    try {
      await pdfAPI.downloadFinancialReport(reportOptions);
      toast.success('Rapport téléchargé avec succès !', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Télécharger le relevé d'un membre
   */
  const handleDownloadStatement = async () => {
    if (!memberId) {
      toast.error('ID de membre manquant');
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Génération du relevé en cours...');
    
    try {
      await pdfAPI.downloadMemberStatement(memberId);
      toast.success('Relevé téléchargé avec succès !', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  // Rendu selon le variant
  switch (variant) {
    case 'receipt':
      return (
        <button
          className="pdf-btn receipt-btn"
          onClick={handleDownloadReceipt}
          disabled={loading || !transactionId}
          title="Télécharger le reçu"
        >
          <FileText size={16} />
          <span>{loading ? 'Génération...' : 'Reçu PDF'}</span>
        </button>
      );
    
    case 'transaction-list':
      return (
        <button
          className="pdf-btn export-btn"
          onClick={handleExportList}
          disabled={loading}
          title="Exporter en PDF"
        >
          <Download size={16} />
          <span>{loading ? 'Export en cours...' : 'Exporter PDF'}</span>
        </button>
      );
    
    case 'financial-report':
      return (
        <button
          className="pdf-btn report-btn"
          onClick={handleDownloadReport}
          disabled={loading}
          title="Télécharger le rapport"
        >
          <TrendingUp size={16} />
          <span>{loading ? 'Génération...' : 'Rapport PDF'}</span>
        </button>
      );
    
    case 'member-statement':
      return (
        <button
          className="pdf-btn statement-btn"
          onClick={handleDownloadStatement}
          disabled={loading || !memberId}
          title="Télécharger le relevé"
        >
          <FileText size={16} />
          <span>{loading ? 'Génération...' : 'Relevé PDF'}</span>
        </button>
      );
    
    default:
      return null;
  }
};

/**
 * Composant de groupe de boutons d'export pour la page Transactions
 */
export const TransactionPdfButtons = ({ transactionId, status, filters }) => {
  return (
    <div className="pdf-buttons-group">
      {/* Bouton export liste (toujours visible) */}
      <PdfExportButtons 
        variant="transaction-list" 
        filters={filters}
      />
      
      {/* Bouton reçu (uniquement si transaction validée) */}
      {transactionId && status === 'validee' && (
        <PdfExportButtons 
          variant="receipt" 
          transactionId={transactionId}
        />
      )}
    </div>
  );
};

/**
 * Composant avec icône de statut pour les actions rapides
 */
export const QuickPdfAction = ({ transactionId, status }) => {
  const [loading, setLoading] = useState(false);
  
  const handleQuickDownload = async () => {
    setLoading(true);
    try {
      await pdfAPI.downloadReceipt(transactionId);
      toast.success('Reçu téléchargé !');
    } catch (error) {
      toast.error('Erreur téléchargement');
    } finally {
      setLoading(false);
    }
  };
  
  if (status !== 'validee') return null;
  
  return (
    <button
      className="quick-pdf-btn"
      onClick={handleQuickDownload}
      disabled={loading}
      title="Télécharger le reçu"
    >
      {loading ? (
        <Clock size={14} className="spinning" />
      ) : (
        <Download size={14} />
      )}
    </button>
  );
};

export default PdfExportButtons;