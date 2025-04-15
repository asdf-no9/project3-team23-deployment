import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Correct import
import './styles/main.css';
import './styles/layout.css';
import {
  BrowserRouter as Router, Routes, Route, Navigate
} from 'react-router-dom'; // Ensure correct import
import { HighContrastProvider } from './context/highContrast.jsx';
import StartOrder from './pages/startOrder.jsx';
import OrderKiosk from './pages/orderKiosk.jsx';
import Sidebar from './components/sidebar.jsx';
import Login from './pages/login.jsx';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HighContrastProvider> { }
      <Router>
        <div id="bodysplit">
          <div className='sidebar'>
            <Sidebar />
          </div>
          <div className='router'>
            <Routes>
              <Route path="/" element={<StartOrder />} />
              <Route path="/login" element={<Login />} />
              <Route path='/order-kiosk/' element={<OrderKiosk />} />
            </Routes>
          </div>
        </div>
      </Router>
    </HighContrastProvider>
  </StrictMode>
);


export { currencyFormatter };