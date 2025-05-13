import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface ProjectStatusChartProps {
  active: number;
  completed: number;
  loading: boolean;
}

const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ 
  active, 
  completed, 
  loading 
}) => {
  // Données pour le graphique
  const data = {
    labels: ['Actifs', 'Terminés'],
    datasets: [
      {
        data: [active, completed],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)',  // Jaune pour les projets actifs
          'rgba(75, 192, 192, 0.7)',   // Vert pour les projets terminés
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options pour le graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12,
          },
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
};

export default ProjectStatusChart;
