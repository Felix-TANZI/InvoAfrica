/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - Reports Section

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Calendar,
  Download,
  ChevronRight
} from 'lucide-react';
import PdfExportModal from '../pdf/PdfExportModal';
import pdfAPI from '../../services/pdfAPI';
import toast from 'react-hot-toast';
import './ReportsSection.css';

/**
 * Section des rapports dans le Dashboard
 */
const ReportsSection = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  /**
   * Raccourcis rapides pour les rapports courants
   */
  const quickReports = [
    {
      id: 'current-month',
      title: 'Rapport du mois en cours',
      description: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      icon: Calendar,
      color: '#FF8C00',
      action: async () => {
        setLoading('current-month');
        try {
          await pdfAPI.downloadFinancialReport({ 
            year: currentYear, 
            month: currentMonth 
          });
          toast.success('Rapport mensuel téléchargé !');
        } catch (error) {
          toast.error('Erreur lors du téléchargement');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'last-month',
      title: 'Rapport du mois dernier',
      description: new Date(currentYear, currentMonth - 2, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      icon: Calendar,
      color: '#3b82f6',
      action: async () => {
        setLoading('last-month');
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const year = currentMonth === 1 ? currentYear - 1 : currentYear;
        try {
          await pdfAPI.downloadFinancialReport({ 
            year, 
            month: lastMonth 
          });
          toast.success('Rapport du mois dernier téléchargé !');
        } catch (error) {
          toast.error('Erreur lors du téléchargement');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'current-year',
      title: 'Rapport annuel',
      description: `Année ${currentYear}`,
      icon: TrendingUp,
      color: '#10b981',
      action: async () => {
        setLoading('current-year');
        try {
          await pdfAPI.downloadFinancialReport({ 
            year: currentYear 
          });
          toast.success('Rapport annuel téléchargé !');
        } catch (error) {
          toast.error('Erreur lors du téléchargement');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'custom',
      title: 'Rapport personnalisé',
      description: 'Choisir la période',
      icon: FileText,
      color: '#8b5cf6',
      action: () => {
        setShowModal(true);
      }
    }
  ];

  return (
    <div className="reports-section">
      <div className="section-header">
        <div className="section-title">
          <FileText size={24} />
          <div>
            <h2>Rapports Financiers</h2>
            <p>Générez et téléchargez vos rapports en PDF</p>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        {quickReports.map(report => {
          const Icon = report.icon;
          const isLoading = loading === report.id;
          
          return (
            <button
              key={report.id}
              className="report-card"
              onClick={report.action}
              disabled={isLoading}
              style={{ '--card-color': report.color }}
            >
              <div className="report-icon" style={{ background: `${report.color}15` }}>
                <Icon size={24} style={{ color: report.color }} />
              </div>
              
              <div className="report-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
              </div>
              
              <div className="report-action">
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <ChevronRight size={20} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tips section */}
      <div className="reports-tips">
        <div className="tip-item">
          <Download size={16} />
          <span>Les rapports sont générés au format PDF professionnel</span>
        </div>
        <div className="tip-item">
          <FileText size={16} />
          <span>Incluent statistiques, graphiques et signature officielle</span>
        </div>
      </div>

      {/* Modal pour rapport personnalisé */}
      <PdfExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        exportType="financial-report"
      />
    </div>
  );
};

export default ReportsSection;