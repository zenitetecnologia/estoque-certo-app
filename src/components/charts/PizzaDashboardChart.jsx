// src/components/charts/PizzaDashboardChart.jsx
import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PizzaDashboardChart({ data }) {
  // data: [{ label, value }]
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => Number(d.value)),
        backgroundColor: [
          '#01696f',
          '#da7101',
          '#d19900',
          '#437a22',
          '#006494',
          '#7a39bb',
        ],
        borderWidth: 1,
      },
    ],
  }), [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div style={{ height: 320 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}