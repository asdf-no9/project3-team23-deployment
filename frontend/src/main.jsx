import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Correct import
import './styles/main.css';
import {
  BrowserRouter as Router, Routes, Route, Navigate
} from 'react-router-dom'; // Ensure correct import
import StartOrder from './pages/startOrder.jsx';
import OrderKiosk from './pages/orderKiosk.jsx';
import Sidebar from './components/sidebar.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <div id="bodysplit">
        <div className='sidebar'>
          <Sidebar />
        </div>
        <div>

          <Routes>
            <Route path="/" element={<StartOrder />} />
            <Route path='/order-kiosk/' element={<Navigate to="/order-kiosk/drinks" />} />
            <Route path="/order-kiosk/:category" element={<OrderKiosk />} />
            <Route path="/order-kiosk/:category/:subcat" element={<OrderKiosk />} />
          </Routes>
        </div>
      </div>
    </Router>
  </StrictMode>
); 