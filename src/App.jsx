import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ClientLog from './pages/ClientLog';
import SupplyRequests from './pages/SupplyRequests';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';

export default function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientLog />} />
          <Route path="/requests" element={<SupplyRequests />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/orders" element={<PurchaseOrders />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
