import CostCalculator from './components/CostCalculator';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calculate a Brick (of data)</h1>
          <p className="text-gray-600 mb-8">Project your earnings based on workload type and consumption patterns</p>
          <CostCalculator />
        </div>
      </div>
      <footer className="bg-white py-4 mt-8 border-t">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Calculate a Brick | Built with React, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">For demonstration purposes only. Not financial advice.</p>
          <p className="mt-2 font-semibold text-green-600">Marketplace Mahoney 2025 💸</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 