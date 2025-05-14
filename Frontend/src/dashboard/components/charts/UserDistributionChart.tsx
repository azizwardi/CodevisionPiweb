import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface UserDistributionChartProps {
  admins: number;
  teamLeaders: number;
  members: number;
  loading: boolean;
}

const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  admins,
  teamLeaders,
  members,
  loading
}) => {
  // Data for the chart
  const data = {
    labels: ['Administrators', 'Team Leaders', 'Members'],
    datasets: [
      {
        data: [admins, teamLeaders, members],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',  // Blue for admins
          'rgba(255, 159, 64, 0.7)',  // Orange for team leaders
          'rgba(75, 192, 192, 0.7)',  // Green for members
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Options for the chart
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
        <Pie data={data} options={options} />
      )}
    </div>
  );
};

export default UserDistributionChart;
