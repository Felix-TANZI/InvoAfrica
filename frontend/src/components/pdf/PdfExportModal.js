/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - PDF Export Modal

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import pdfAPI from '../../services/pdfAPI';
import toast from 'react-hot-toast';
import './PdfExportModal.css';

/**
 * Modal pour les options d'export avancées
 */
const PdfExportModal = ({ isOpen, onClose, exportType = 'transactions' }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    // Options pour transactions
    includeDetails: true,
    includeStats: true,
    
    // Options pour rapports financiers
    reportPeriod: 'month',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: '',
    
    // Options communes
    includeGraphs: false,
    format: 'detailed' // 'detailed' ou 'summary'
  });

  if (!isOpen) return null;

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Génération du PDF...');

    try {
      if (exportType === 'financial-report') {
        const reportOptions = {
          year: options.year,
          month: options.reportPeriod === 'month' ? options.month : null,
          start_date: options.reportPeriod === 'custom' ? options.startDate : null,
          end_date: options.reportPeriod === 'custom' ? options.endDate : null
        };
        
        await pdfAPI.downloadFinancialReport(reportOptions);
      } else {
        // Export transactions par défaut
        await pdfAPI.exportTransactionsList({});
      }

      toast.success('PDF généré avec succès !', { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la génération', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={e => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div className="modal-title-section">
            <FileText size={24} className="modal-icon" />
            <div>
              <h2>
                {exportType === 'financial-report' 
                  ? 'Générer un rapport financier' 
                  : 'Options d\'export PDF'}
              </h2>
              <p className="modal-subtitle">
                Personnalisez votre document avant l'export
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pdf-modal-body">
          {exportType === 'financial-report' ? (
            // Options pour rapport financier
            <>
              <div className="form-group">
                <label>Période du rapport</label>
                <select
                  value={options.reportPeriod}
                  onChange={e => handleOptionChange('reportPeriod', e.target.value)}
                  className="form-select"
                >
                  <option value="month">Mensuel</option>
                  <option value="year">Annuel</option>
                  <option value="custom">Personnalisée</option>
                </select>
              </div>

              {options.reportPeriod === 'month' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Mois</label>
                    <select
                      value={options.month}
                      onChange={e => handleOptionChange('month', parseInt(e.target.value))}
                      className="form-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleDateString('fr-FR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Année</label>
                    <input
                      type="number"
                      value={options.year}
                      onChange={e => handleOptionChange('year', parseInt(e.target.value))}
                      className="form-input"
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>
              )}

              {options.reportPeriod === 'year' && (
                <div className="form-group">
                  <label>Année</label>
                  <input
                    type="number"
                    value={options.year}
                    onChange={e => handleOptionChange('year', parseInt(e.target.value))}
                    className="form-input"
                    min="2020"
                    max="2030"
                  />
                </div>
              )}

              {options.reportPeriod === 'custom' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Date de début</label>
                    <input
                      type="date"
                      value={options.startDate}
                      onChange={e => handleOptionChange('startDate', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de fin</label>
                    <input
                      type="date"
                      value={options.endDate}
                      onChange={e => handleOptionChange('endDate', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="form-divider"></div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={options.includeStats}
                    onChange={e => handleOptionChange('includeStats', e.target.checked)}
                  />
                  <span>Inclure les statistiques détaillées</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={options.includeGraphs}
                    onChange={e => handleOptionChange('includeGraphs', e.target.checked)}
                  />
                  <span>Inclure des graphiques (bientôt disponible)</span>
                </label>
                {options.includeGraphs && (
                  <div className="info-message">
                    <AlertCircle size={16} />
                    <span>Fonctionnalité en cours de développement</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Options pour export transactions
            <>
              <div className="form-group">
                <label>Format du document</label>
                <select
                  value={options.format}
                  onChange={e => handleOptionChange('format', e.target.value)}
                  className="form-select"
                >
                  <option value="detailed">Détaillé (avec toutes les colonnes)</option>
                  <option value="summary">Résumé (format compact)</option>
                </select>
              </div>

              <div className="form-divider"></div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={options.includeStats}
                    onChange={e => handleOptionChange('includeStats', e.target.checked)}
                  />
                  <span>Inclure les statistiques en en-tête</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={options.includeDetails}
                    onChange={e => handleOptionChange('includeDetails', e.target.checked)}
                  />
                  <span>Inclure les détails des transactions</span>
                </label>
              </div>

              <div className="info-message success">
                <CheckCircle size={16} />
                <span>Les filtres actuels seront appliqués à l'export</span>
              </div>
            </>
          )}
        </div>

        <div className="pdf-modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button 
            className="btn-primary" 
            onClick={handleExport}
            disabled={loading}
          >
            <Download size={18} />
            {loading ? 'Génération...' : 'Générer le PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfExportModal;