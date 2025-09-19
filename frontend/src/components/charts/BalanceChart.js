import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './BalanceChart.css';

const BalanceChart = ({ data = [], title = "Évolution du Solde" }) => {
  // Formatage des données pour le graphique
  const formatData = (rawData) => {
    if (!Array.isArray(rawData)) return [];
    
    return rawData.map(item => ({
      month: `${item.month}/${item.year}`,
      solde: item.solde || 0,
      recettes: item.recettes || 0,
      depenses: item.depenses || 0,
    }));
  };

  const chartData = formatData(data);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`Mois: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className={`tooltip-item tooltip-${entry.dataKey}`}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="balance-chart">
      <h3 className="chart-title">{title}</h3>
      
      {chartData.length === 0 ? (
        <div className="chart-empty">
          <p>Aucune donnée disponible</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line 
              type="monotone" 
              dataKey="solde" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Solde"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="recettes" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Recettes"
              strokeDasharray="5 5"
            />
            
            <Line 
              type="monotone" 
              dataKey="depenses" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Dépenses"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BalanceChart;