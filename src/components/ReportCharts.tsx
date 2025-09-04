"use client";
import { Bar, Pie } from "react-chartjs-2";

interface BarData {
  fecha: string;
  total: number;
}
interface PieData {
  usuario: string;
  total: number;
}

interface ReportChartsProps {
  barData: BarData[];
  pieData: PieData[];
  pieColors: string[];
}

export default function ReportCharts({
  barData,
  pieData,
  pieColors,
}: ReportChartsProps) {
  // Preparar datos para Chart.js
  const chartBarData = {
    labels: barData.map((d) => d.fecha),
    datasets: [
      {
        label: "Ventas por día",
        data: barData.map((d) => d.total),
        backgroundColor: "#2563eb",
      },
    ],
  };
  const chartPieData = {
    labels: pieData.map((d) => d.usuario),
    datasets: [
      {
        label: "Ventas por usuario",
        data: pieData.map((d) => d.total),
        backgroundColor: pieColors,
      },
    ],
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div>
        <h2 className="font-bold mb-2">Ventas por día (Chart.js)</h2>
        <Bar
          data={chartBarData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
          }}
        />
      </div>
      <div>
        <h2 className="font-bold mb-2">Ventas por usuario (Chart.js)</h2>
        <Pie
          data={chartPieData}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          }}
        />
      </div>
    </div>
  );
}
