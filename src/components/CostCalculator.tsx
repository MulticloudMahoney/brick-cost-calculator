import React, { useState } from 'react';
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
  Filler,
} from 'chart.js';

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

interface WorkloadProfile {
  dbu_rate: number;
  gb_per_dbu: number;
}

interface WorkloadProfiles {
  [key: string]: WorkloadProfile;
}

const baseProfiles: WorkloadProfiles = {
  "All-Purpose Compute": { dbu_rate: 0.55, gb_per_dbu: 2.5 },
  "SQL Compute": { dbu_rate: 0.22, gb_per_dbu: 3.5 },
  "DLT Core": { dbu_rate: 0.20, gb_per_dbu: 3.0 },
  "DLT Pro": { dbu_rate: 0.25, gb_per_dbu: 3.0 },
  "DLT Advanced": { dbu_rate: 0.36, gb_per_dbu: 3.5 },
  "GenAI (custom)": { dbu_rate: 0.55, gb_per_dbu: 2.0 },
};

interface ProjectionRow {
  Month: number;
  DBUs: number;
  'Storage (GB)': number;
  'Compute ($)': number;
  'Storage ($)': number;
  'Total ($)': number;
}

const CostCalculator: React.FC = () => {
  const [workload, setWorkload] = useState<string>("All-Purpose Compute");
  const [usePhoton, setUsePhoton] = useState<boolean>(false);
  const [dbus, setDbus] = useState<number>(10000);
  const [storagePrice, setStoragePrice] = useState<number>(0.02);
  const [growth, setGrowth] = useState<number>(0.15);
  const [years, setYears] = useState<number>(5);
  const [projection, setProjection] = useState<ProjectionRow[]>([]);

  const calculateProjection = () => {
    const profile = { ...baseProfiles[workload] };
    if (usePhoton) {
      profile.gb_per_dbu *= 1.1;
    }

    const months = years * 12;
    let currentDbus = dbus;
    const rows: ProjectionRow[] = [];

    for (let month = 1; month <= months; month++) {
      const computeCost = currentDbus * profile.dbu_rate;
      const storageGb = currentDbus * profile.gb_per_dbu;
      const storageCost = storageGb * storagePrice;
      const total = computeCost + storageCost;

      rows.push({
        Month: month,
        DBUs: Math.round(currentDbus),
        'Storage (GB)': Math.round(storageGb * 100) / 100,
        'Compute ($)': Math.round(computeCost * 100) / 100,
        'Storage ($)': Math.round(storageCost * 100) / 100,
        'Total ($)': Math.round(total * 100) / 100,
      });

      currentDbus *= (1 + growth);
    }

    setProjection(rows);
  };

  const handleDownload = (format: 'excel' | 'json') => {
    const data = projection.map(row => ({
      ...row,
      'Total ($)': row['Total ($)'].toFixed(2),
      'Compute ($)': row['Compute ($)'].toFixed(2),
      'Storage ($)': row['Storage ($)'].toFixed(2),
    }));

    if (format === 'excel') {
      // Create Excel file
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projection.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // Create JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'projection.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const chartData = {
    labels: projection.map(row => `Month ${row.Month}`),
    datasets: [
      {
        label: 'Total Monthly Cost ($)',
        data: projection.map(row => row['Total ($)']),
        borderColor: '#1f77b4',
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Databricks Cost Projection Over Time',
        font: {
          size: 14,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">📊 Databricks DBU Consumption Forecast</h2>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workload Type
              </label>
              <select
                value={workload}
                onChange={(e) => setWorkload(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                title="Select workload type"
              >
                {Object.keys(baseProfiles).map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="photon"
                checked={usePhoton}
                onChange={(e) => setUsePhoton(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="photon" className="ml-2 block text-sm text-gray-700">
                Use Photon ⚡
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial DBUs: {dbus.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={dbus}
                onChange={(e) => setDbus(Number(e.target.value))}
                className="w-full"
                title="Set initial DBUs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage $/GB: ${storagePrice.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.001"
                max="0.10"
                step="0.001"
                value={storagePrice}
                onChange={(e) => setStoragePrice(Number(e.target.value))}
                className="w-full"
                title="Set storage price per GB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Growth %: {(growth * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={growth}
                onChange={(e) => setGrowth(Number(e.target.value))}
                className="w-full"
                title="Set monthly growth rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projection Years: {years}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full"
                title="Set projection years"
              />
            </div>
          </div>

          <button
            onClick={calculateProjection}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            🚀 Run Projection
          </button>

          {projection.length > 0 && (
            <div className="mt-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DBUs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage (GB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compute ($)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage ($)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projection.map((row) => (
                      <tr key={row.Month}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.Month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.DBUs.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row['Storage (GB)'].toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row['Compute ($)'].toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row['Storage ($)'].toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row['Total ($)'].toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <Line data={chartData} options={chartOptions} />
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => handleDownload('excel')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  📥 Download Excel
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  📥 Download JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostCalculator; 