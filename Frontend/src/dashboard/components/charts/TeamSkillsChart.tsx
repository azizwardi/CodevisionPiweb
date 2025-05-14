import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register necessary components for Chart.js
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Skill {
  name: string;
  level: number;
}

interface TeamSkillsChartProps {
  skills: Skill[];
  loading: boolean;
}

const TeamSkillsChart: React.FC<TeamSkillsChartProps> = ({
  skills,
  loading
}) => {
  // Prepare data for the chart
  const labels = skills.map(skill => skill.name);
  const skillLevels = skills.map(skill => skill.level);

  // Data for the chart
  const data = {
    labels,
    datasets: [
      {
        label: 'Skill Level',
        data: skillLevels,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
      }
    ],
  };

  // Options for the chart
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12
          }
        },
        ticks: {
          backdropColor: 'transparent',
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          stepSize: 1,
          min: 0,
          max: 5
        }
      }
    },
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
            return `${label}: ${value}/5`;
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
        <Radar data={data} options={options} />
      )}
    </div>
  );
};

export default TeamSkillsChart;
