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
  'Reseller Revenue (40%)': number;
  View: string;
  'Quarterly Payment to Reseller (5% of PB)': number;
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
  const [currentJoeEarnings, setCurrentJoeEarnings] = useState<number>(0);
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

    for (let month = 1; month <= months; month++) {
      const computeCost = currentDbus * profile.dbu_rate;
      const storageGb = currentDbus * profile.gb_per_dbu;
      const storagePb = storageGb / 1024;
      const unitPricePb = storagePrice * 1024;
      const storageCostTotal = storagePb * unitPricePb;
      const total = computeCost + storageCostTotal;

      const costIncrease = prevCost !== null ? total - prevCost : null;
      prevCost = total;

      const gcpAdjusted = total / 0.97;
      const resellerMargin = 0.25;
      const resellerRevenue = gcpAdjusted * resellerMargin;
      const quarterlyPayment = month % 3 === 0 ? storagePb * 0.05 * unitPricePb : 0;
      const grossProfit = resellerRevenue + quarterlyPayment;
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
        'Reseller Revenue (40%)': Number((resellerRevenue * 0.40).toFixed(2)),
        View: 'Monthly',
        'Quarterly Payment to Reseller (5% of PB)': Number(quarterlyPayment.toFixed(2)),
        'Reseller Gross Profit (USD)': Number(grossProfit.toFixed(2)),
        'Reseller Net Profit (USD)': Number(netProfit.toFixed(2)),
        Joe: Number(joe.toFixed(2)),
        Terry: Number(terry.toFixed(2)),
        REFERRAL: Number(referral.toFixed(2))
      });

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
        
        const currentValue = startValue + (endValue - startValue) * progress;
        setCurrentJoeEarnings(currentValue);

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
      'Reseller Revenue (40%)': row['Reseller Revenue (40%)'].toFixed(2),
      'Quarterly Payment to Reseller (5% of PB)': row['Quarterly Payment to Reseller (5% of PB)'].toFixed(2),
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
        label: 'Monthly Cost ($)',
        data: projection.length > 0 ? projection.map(row => row['Monthly Cost (USD)']) : [],
        borderColor: '#1f77b4',
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Reseller Gross Profit ($)',
        data: projection.length > 0 ? projection.map(row => row['Reseller Gross Profit (USD)']) : [],
        borderColor: '#2ca02c',
        backgroundColor: 'rgba(44, 160, 44, 0.1)',
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
        text: 'Databricks Cost and Profit Projection Over Time',
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

          {projection.length > 0 && (
            <>
              <div className="money-motivator bg-gradient-to-br from-emerald-300 to-green-500 rounded-lg p-8 flex flex-col justify-center items-center border-8 border-green-600 mb-6 relative overflow-hidden shadow-2xl transform hover:scale-102 transition-all duration-300" style={{ 
                backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)`
              }}>
                {/* Corner decorations to mimic dollar bill */}
                <div className="absolute top-3 left-3 w-12 h-12 border-4 border-green-800 rounded-full flex items-center justify-center text-green-800 font-bold text-2xl bg-green-100 shadow-lg">$</div>
                <div className="absolute top-3 right-3 w-12 h-12 border-4 border-green-800 rounded-full flex items-center justify-center text-green-800 font-bold text-2xl bg-green-100 shadow-lg">$</div>
                <div className="absolute bottom-3 left-3 w-12 h-12 border-4 border-green-800 rounded-full flex items-center justify-center text-green-800 font-bold text-2xl bg-green-100 shadow-lg">$</div>
                <div className="absolute bottom-3 right-3 w-12 h-12 border-4 border-green-800 rounded-full flex items-center justify-center text-green-800 font-bold text-2xl bg-green-100 shadow-lg">$</div>
                
                <h3 className="text-3xl font-extrabold text-white mb-2 text-shadow-lg">Mahoney's Money Motivator 💰</h3>
                <p className="text-base text-white mb-6 text-center italic max-w-md font-medium text-shadow">
                  "Credit, forget it? - you think a crackhead paying you back,<br />nah flip a zip to an ounce then bounce"
                </p>
                <div className="text-8xl font-black text-gray-900 mb-3 tracking-tight bg-green-300 px-6 py-2 rounded-lg shadow-lg">
                  ${currentJoeEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xl text-white font-bold text-shadow">
                  {isAnimating ? 'Calculating...' : 'Final Total Earnings (Consumption + Resell)'}
                </div>
                <div className="mt-6 text-lg text-white space-y-2">
                  <p className="font-bold text-shadow bg-green-600/30 px-4 py-2 rounded-lg">
                    Net New Private Offer #1: <span className="text-4xl font-black text-gray-900 bg-green-300 px-2 rounded">${projection[0].Joe.toLocaleString()}</span>
                  </p>
                  <p className="font-bold text-shadow bg-green-600/30 px-4 py-2 rounded-lg">
                    Final Projected Earnings (Consumption + Resell): <span className="text-4xl font-black text-gray-900 bg-green-300 px-2 rounded">${projection[projection.length - 1].Joe.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </>
          )}

          {projection.length > 0 && (
            <>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(projection[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projection.map((row) => (
                      <tr key={row.Month}>
                        {Object.values(row).map((value, index) => (
                          <td
                            key={index}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => handleDownload('excel')}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  📥 Download Excel
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  📥 Download JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostCalculator; 