/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     version : beta 2.0 - Composant bouton PDF réutilisable */

import React, { useState } from 'react';
import { Download, FileText, Users, CreditCard } from 'lucide-react';
import { pdfAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Composant bouton PDF réutilisable
 * 
 * @param {string} variant - Type d'export: 'team-members' | 'adherents' | 'team-contributions' | 'adherent-contributions'
 * @param {object} filters - Filtres à appliquer
 * @param {string} label - Texte du bouton (optionnel)
 * @param {string} className - Classes CSS supplémentaires (optionnel)
 */
const PdfExportButton = ({ 
  variant, 
  filters = {}, 
  label, 
  className = '',
  options = {}
}) => {
  const [loading, setLoading] = useState(false);
  
  const getButtonConfig = () => {
    switch (variant) {
      case 'team-members':
        return {
          icon: Users,
          defaultLabel: 'Exporter PDF',
          color: '#3b82f6',
          handler: () => pdfAPI.exportTeamMembers(filters)
        };
      
      case 'adherents':
        return {
          icon: Users,
          defaultLabel: 'Exporter PDF',
          color: '#10b981',
          handler: () => pdfAPI.exportAdherents(filters)
        };
      
      case 'team-contributions':
        return {
          icon: CreditCard,
          defaultLabel: 'Exporter Cotisations',
          color: '#8b5cf6',
          handler: () => pdfAPI.exportTeamContributions(options)
        };
      
      case 'adherent-contributions':
        return {
          icon: FileText,
          defaultLabel: 'Exporter Abonnements',
          color: '#f59e0b',
          handler: () => pdfAPI.exportAdherentContributions(options)
        };
      
      default:
        return {
          icon: Download,
          defaultLabel: 'Télécharger PDF',
          color: '#6b7280',
          handler: () => Promise.reject(new Error('Variant non supporté'))
        };
    }
  };
  
  const config = getButtonConfig();
  const Icon = config.icon;
  const buttonLabel = label || config.defaultLabel;
  
  const handleExport = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Génération du PDF en cours...');
    
    try {
      await config.handler();
      toast.success('PDF téléchargé avec succès !', { id: loadingToast });
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      toast.error(error.message || 'Erreur lors de l\'export', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`pdf-export-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        background: loading ? '#9ca3af' : config.color,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        opacity: loading ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
    >
      <Icon size={16} />
      <span>{loading ? 'Génération...' : buttonLabel}</span>
    </button>
  );
};

/**
 * Composant dropdown pour filtrer avant export (payé/non payé)
 */
export const PdfExportDropdown = ({ variant, currentMonth, currentYear }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isContributions = variant === 'team-contributions' || variant === 'adherent-contributions';
  
  const handleExport = async (paid = null) => {
    setLoading(true);
    setShowMenu(false);
    
    const loadingToast = toast.loading('Génération du PDF en cours...');
    
    try {
      const options = {
        year: currentYear,
        month: currentMonth
      };
      
      if (paid !== null) {
        options.paid = paid;
      }
      
      if (variant === 'team-contributions') {
        await pdfAPI.exportTeamContributions(options);
      } else if (variant === 'adherent-contributions') {
        await pdfAPI.exportAdherentContributions(options);
      }
      
      toast.success('PDF téléchargé avec succès !', { id: loadingToast });
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      toast.error(error.message || 'Erreur lors de l\'export', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };
  
  if (!isContributions) {
    return <PdfExportButton variant={variant} options={{ year: currentYear, month: currentMonth }} />;
  }
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: loading ? '#9ca3af' : '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Download size={16} />
        <span>{loading ? 'Génération...' : 'Exporter PDF'}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="currentColor"
          style={{ marginLeft: '4px' }}
        >
          <path d="M6 8L2 4h8L6 8z"/>
        </svg>
      </button>
      
      {showMenu && !loading && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden'
          }}
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            onClick={() => handleExport(null)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#374151'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <FileText size={16} />
            <span>Tous</span>
          </button>
          
          <button
            onClick={() => handleExport('yes')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#10b981'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.5 3.5L6 11l-3.5-3.5L1 9l5 5 9-9-1.5-1.5z"/>
            </svg>
            <span>Payées uniquement</span>
          </button>
          
          <button
            onClick={() => handleExport('no')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ef4444'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Non payées uniquement</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfExportButton;