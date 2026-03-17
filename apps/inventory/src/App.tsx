import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Categories } from './components/Categories';
import { StockLogs } from './components/StockLogs';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import './App.css';

// Using Dashboard component as the Inventory placeholder initially if they mean the Master Inventory view
// We can also let the Dashboard just be at /dashboard and Inventory at /inventory
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Dashboard />} /> {/* Master table is inside Dashboard for now */}
        <Route path="/categories" element={<Categories />} />
        <Route path="/logs" element={<StockLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
