# Databricks Cost Calculator

A React-based web application for calculating and projecting Databricks costs based on different workload types, DBU consumption, and storage requirements.

## Features

- Multiple workload type support (All-Purpose Compute, SQL Compute, DLT Core, DLT Pro, DLT Advanced, GenAI)
- Photon acceleration option
- Customizable DBU consumption
- Adjustable storage pricing
- Monthly growth rate projection
- Multi-year cost forecasting
- Interactive cost visualization
- Data export in CSV and JSON formats

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MulticloudMahoney/brick-cost-calculator.git
cd brick-cost-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Select your workload type from the dropdown
2. Toggle Photon acceleration if needed
3. Adjust the initial DBU consumption using the slider
4. Set your storage price per GB
5. Configure the monthly growth rate
6. Select the number of years for projection
7. View the cost projection chart and table
8. Export data in CSV or JSON format as needed

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Chart.js
- Vite

## License

MIT
