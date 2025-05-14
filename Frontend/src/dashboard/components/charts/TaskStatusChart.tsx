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

interface TaskStatusChartProps {
  pending: number;
  inProgress: number;
  completed: number;
  loading: boolean;
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({
  pending,
  inProgress,
  completed,
  loading
}) => {
  // Data for the chart
  const data = {
    labels: ['Pending', 'In Progress', 'Completed'],
    datasets: [
      {
        label: 'Number of tasks',
        data: [pending, inProgress, completed],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',   // Red for pending tasks
          'rgba(255, 159, 64, 0.7)',   // Orange for in-progress tasks
          'rgba(75, 192, 192, 0.7)',   // Green for completed tasks
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
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
        display: false,
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

export default TaskStatusChart;
