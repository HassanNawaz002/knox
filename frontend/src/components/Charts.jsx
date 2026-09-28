import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title,
  Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement, Filler
);

/**
 * Battery & Temperature Line Chart (green)
 */
export function BatteryTempChart({ data }) {
  if (!data) return (
    <div className="empty-state" style={{ padding: '30px' }}>
      <div className="empty-state-icon">📈</div>
      <div className="empty-state-sub">Telemetry data unavailable</div>
    </div>
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 11, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (ctx) => {
            if (ctx.datasetIndex === 0) return ` Battery: ${ctx.parsed.y}%`;
            return ` Temp: ${ctx.parsed.y}°C`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 10 },
          color: '#9ca3af',
          maxTicksLimit: 12,
        },
      },
      y: {
        position: 'left',
        min: 0,
        max: 100,
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 10 },
          color: '#9ca3af',
          callback: (v) => `${v}%`,
        },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          font: { size: 10 },
          color: '#9ca3af',
          callback: (v) => `${v}°C`,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}

/**
 * App RAM Usage Doughnut Chart
 */
export function AppRamChart({ data }) {
  if (!data || !data.labels?.length) return (
    <div className="empty-state" style={{ padding: '30px' }}>
      <div className="empty-state-icon">🍩</div>
      <div className="empty-state-sub">No app memory data available</div>
    </div>
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { size: 10, family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          padding: 8,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} MB`,
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
