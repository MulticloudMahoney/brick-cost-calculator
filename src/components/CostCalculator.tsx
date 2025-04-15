import React, { useState, useEffect, useRef } from 'react';
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
  'Storage Utilization (PB)': number;
  'Unit Price (USD per PB/Month)': number;
  'Monthly Cost (USD)': number;
  'Monthly Cost Increase (USD)': number | null;
  'GCP Markup (3%) Adjusted Price': number;
  'Reseller Margin (%)': number;
  'Reseller Revenue (USD)': number;
  'Quarterly Consumption (USD)': number;
  'Current Quarter Consumption (USD)': number;
  'Quarterly Payment (USD)': number;
  'Reseller Gross Profit (USD)': number;
  'Reseller Net Profit (USD)': number;
  Joe: number;
  Terry: number;
  REFERRAL: number;
}

const CostCalculator: React.FC = () => {
  const [workload, setWorkload] = useState<string>("All-Purpose Compute");
  const [usePhoton, setUsePhoton] = useState<boolean>(false);
  const [dbus, setDbus] = useState<number>(10000);
  const [storagePrice, setStoragePrice] = useState<number>(0.02);
  const [growth, setGrowth] = useState<number>(0.15);
  const [years, setYears] = useState<number>(5);
  const [projection, setProjection] = useState<ProjectionRow[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(1.0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with McGregor sound
    audioRef.current = new Audio('/mcgregor.mp3');
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, []);

  // Update audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  const calculateProjection = () => {
    // Play McGregor sound effect
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.log('Audio playback failed:', error));
    }

    const profile = { ...baseProfiles[workload] };
    if (usePhoton) {
      profile.gb_per_dbu *= 1.1;
    }

    const months = years * 12;
    let currentDbus = dbus;
    const rows: ProjectionRow[] = [];
    let prevCost: number | null = null;
    let quarterlyConsumption = 0;
    let totalQuarterlyConsumption = 0;

    for (let month = 1; month <= months; month++) {
      const computeCost = currentDbus * profile.dbu_rate;
      const storageGb = currentDbus * profile.gb_per_dbu;
      const storagePb = storageGb / 1024;
      const unitPricePb = storagePrice * 1024;
      const storageCostTotal = storagePb * unitPricePb;
      
      // Base cost before any markups
      const baseCost = computeCost + storageCostTotal;
      
      // Add to quarterly consumption tracking
      quarterlyConsumption += baseCost;
      totalQuarterlyConsumption = quarterlyConsumption;

      // GCP markup (3%)
      const gcpAdjusted = baseCost / 0.97;
      
      // This is what the end user sees on their GCP bill
      const total = gcpAdjusted;

      const costIncrease = prevCost !== null ? total - prevCost : null;
      prevCost = total;

      // Calculate quarterly payment (5% of total consumption for the quarter)
      const quarterlyPayment = month % 3 === 0 ? quarterlyConsumption * 0.05 : 0;
      
      // Reseller calculations
      const resellerMargin = 0.25;
      const resellerRevenue = gcpAdjusted * resellerMargin;
      const grossProfit = resellerRevenue + (month % 3 === 0 ? quarterlyPayment : 0);
      const netProfit = grossProfit * 0.60;
      const joe = netProfit * 0.40;
      const terry = netProfit * 0.40;
      const referral = netProfit * 0.10;

      rows.push({
        Month: month,
        'Storage Utilization (PB)': Number(storagePb.toFixed(4)),
        'Unit Price (USD per PB/Month)': Number(unitPricePb.toFixed(2)),
        'Monthly Cost (USD)': Number(total.toFixed(2)),
        'Monthly Cost Increase (USD)': costIncrease ? Number(costIncrease.toFixed(2)) : null,
        'GCP Markup (3%) Adjusted Price': Number(gcpAdjusted.toFixed(2)),
        'Reseller Margin (%)': 25,
        'Reseller Revenue (USD)': Number(resellerRevenue.toFixed(2)),
        'Quarterly Consumption (USD)': Number(totalQuarterlyConsumption.toFixed(2)),
        'Current Quarter Consumption (USD)': Number(quarterlyConsumption.toFixed(2)),
        'Quarterly Payment (USD)': Number(quarterlyPayment.toFixed(2)),
        'Reseller Gross Profit (USD)': Number(grossProfit.toFixed(2)),
        'Reseller Net Profit (USD)': Number(netProfit.toFixed(2)),
        Joe: Number(joe.toFixed(2)),
        Terry: Number(terry.toFixed(2)),
        REFERRAL: Number(referral.toFixed(2))
      });

      // Reset quarterly consumption tracking at end of quarter
      if (month % 3 === 0) {
        quarterlyConsumption = 0;
      }

      currentDbus *= (1 + growth);
    }

    setProjection(rows);
  };

  useEffect(() => {
    if (projection.length > 0 && !isAnimating) {
      setIsAnimating(true);
      const startValue = projection[0].Joe;
      const endValue = projection[projection.length - 1].Joe;
      const duration = 5000; // 5 seconds animation

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          startTimeRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [projection]);

  const handleDownload = (format: 'excel' | 'json') => {
    const data = projection.map(row => ({
      ...row,
      'Monthly Cost (USD)': row['Monthly Cost (USD)'].toFixed(2),
      'Monthly Cost Increase (USD)': row['Monthly Cost Increase (USD)']?.toFixed(2) || '',
      'GCP Markup (3%) Adjusted Price': row['GCP Markup (3%) Adjusted Price'].toFixed(2),
      'Reseller Revenue (USD)': row['Reseller Revenue (USD)'].toFixed(2),
      'Quarterly Consumption (USD)': row['Quarterly Consumption (USD)'].toFixed(2),
      'Current Quarter Consumption (USD)': row['Current Quarter Consumption (USD)'].toFixed(2),
      'Quarterly Payment (USD)': row['Quarterly Payment (USD)'].toFixed(2),
      'Reseller Gross Profit (USD)': row['Reseller Gross Profit (USD)'].toFixed(2),
      'Reseller Net Profit (USD)': row['Reseller Net Profit (USD)'].toFixed(2),
      Joe: row.Joe.toFixed(2),
      Terry: row.Terry.toFixed(2),
      REFERRAL: row.REFERRAL.toFixed(2)
    }));

    if (format === 'excel') {
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
    labels: projection.length > 0 ? projection.map(row => `Month ${row.Month}`) : [],
    datasets: [
      {
        label: 'GCP Bill (Customer Cost)',
        data: projection.length > 0 ? projection.map(row => row['Monthly Cost (USD)']) : [],
        borderColor: '#1f77b4',
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Quarterly Consumption',
        data: projection.length > 0 ? projection.map(row => row['Current Quarter Consumption (USD)']) : [],
        borderColor: '#2ca02c',
        backgroundColor: 'rgba(44, 160, 44, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Quarterly Payments (5%)',
        data: projection.length > 0 ? projection.map(row => row['Quarterly Payment (USD)']) : [],
        borderColor: '#ff7f0e',
        backgroundColor: 'rgba(255, 127, 14, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y1',
      },
      {
        label: 'Monthly Reseller Revenue (25%)',
        data: projection.length > 0 ? projection.map(row => row['Reseller Revenue (USD)']) : [],
        borderColor: '#d62728',
        backgroundColor: 'rgba(214, 39, 40, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y1',
      }
    ],
  };

  const earningsChartData = {
    labels: projection.length > 0 ? projection.map(row => `Month ${row.Month}`) : [],
    datasets: [
      {
        label: 'Monthly Cost ($)',
        data: projection.length > 0 ? projection.map(row => row['Monthly Cost (USD)']) : [],
        borderColor: '#1f77b4',
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
        fill: true,
      },
      {
        label: 'Joe Earnings ($)',
        data: projection.length > 0 ? projection.map(row => row.Joe) : [],
        borderColor: '#9467bd',
        backgroundColor: 'rgba(148, 103, 189, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
        fill: true,
      },
      {
        label: 'Terry Earnings ($)',
        data: projection.length > 0 ? projection.map(row => row.Terry) : [],
        borderColor: '#8c564b',
        backgroundColor: 'rgba(140, 86, 75, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
        fill: true,
      }
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
        text: 'Customer Cost and Revenue Streams',
        font: {
          size: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Customer Cost & Consumption ($)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue Streams ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const earningsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Cost vs Individual Earnings',
        font: {
          size: 14,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Monthly Cost ($)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Individual Earnings ($)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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
                aria-label="Select workload type"
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
                aria-label="Initial DBUs"
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
                aria-label="Storage price per GB"
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
                aria-label="Monthly growth percentage"
                title="Set monthly growth percentage"
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
                aria-label="Projection years"
                title="Set projection years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sound Effect Volume: {Math.round(audioVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioVolume}
                onChange={(e) => setAudioVolume(Number(e.target.value))}
                className="w-full"
                aria-label="Sound effect volume"
                title="Set sound effect volume"
              />
            </div>
          </div>

          <button
            onClick={calculateProjection}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            🚀 Run Projection
          </button>
        </div>
      </div>

      {projection.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Line data={earningsChartData} options={earningsChartOptions} />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleDownload('excel')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              📊 Download Excel
            </button>
            <button
              onClick={() => handleDownload('json')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculator; 