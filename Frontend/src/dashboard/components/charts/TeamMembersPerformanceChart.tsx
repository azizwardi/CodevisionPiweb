import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TeamMember {
  name: string;
  tasksCompleted: number;
  tasksTotal: number;
  performancePercentage: number;
}

interface TeamMembersPerformanceChartProps {
  teamMembers: TeamMember[];
  loading: boolean;
}

const TeamMembersPerformanceChart: React.FC<TeamMembersPerformanceChartProps> = ({
  teamMembers,
  loading
}) => {
  // Prepare data for the chart
  const labels = teamMembers.map(member => member.name);
  const completedData = teamMembers.map(member => member.tasksCompleted);
  const totalData = teamMembers.map(member => member.tasksTotal);
  const performanceData = teamMembers.map(member => member.performancePercentage);

  // Data for the chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Completed Tasks',
        data: completedData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Tasks',
        data: totalData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Options for the chart
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          }
        }
      }
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
    <div className="h-64">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Bar data={data} options={options} />
      )}
    </div>
  );
};

export default TeamMembersPerformanceChart;
