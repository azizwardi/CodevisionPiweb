import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface QuizActivityChartProps {
  published: number;
  attempts: number;
  completed: number;
  certificates: number;
  loading: boolean;
}

const QuizActivityChart: React.FC<QuizActivityChartProps> = ({
  published,
  attempts,
  completed,
  certificates,
  loading
}) => {
  // Data for the chart
  const data = {
    labels: ['Published Quizzes', 'Attempts', 'Completed', 'Certificates'],
    datasets: [
      {
        label: 'Quiz Activity',
        data: [published, attempts, completed, certificates],
        fill: true,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
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
        <Line data={data} options={options} />
      )}
    </div>
  );
};

export default QuizActivityChart;
