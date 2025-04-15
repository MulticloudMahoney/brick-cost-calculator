import CostCalculator from './components/CostCalculator';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Databricks Cost Calculator</h1>
        <CostCalculator />
      </div>
    </div>
  );
}

export default App; 