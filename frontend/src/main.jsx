import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Correct import
import './styles/main.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Ensure correct import
import StartOrder from './pages/startOrder.jsx';
import OrderKiosk from './pages/orderKiosk.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<StartOrder />} />
        <Route path="/order-kiosk" element={<OrderKiosk />} />
      </Routes>
    </Router>
  </StrictMode>
); 