import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Données fictives pour simuler l'activité récente
// Dans une application réelle, ces données viendraient de l'API
const generateMockData = () => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  // Prendre les 6 derniers mois
  const labels = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    labels.push(months[monthIndex]);
  }

  // Générer des données aléatoires pour les utilisateurs, projets et tâches
  const usersData = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10) + 1);
  const projectsData = Array.from({ length: 6 }, () => Math.floor(Math.random() * 5) + 1);
  const tasksData = Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 5);

  return { labels, usersData, projectsData, tasksData };
};

const { labels, usersData, projectsData, tasksData } = generateMockData();

interface ActivityOverviewChartProps {
  loading: boolean;
}

const ActivityOverviewChart: React.FC<ActivityOverviewChartProps> = ({ loading }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: usersData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Nouveaux projets',
        data: projectsData,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Nouvelles tâches',
        data: tasksData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
        },
      },
      title: {
        display: true,
        text: 'Activité des 6 derniers mois',
        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        },
        grid: {
          display: false
        }
      }
    },
  };

  return (
    <div className="h-80">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
};

export default ActivityOverviewChart;
