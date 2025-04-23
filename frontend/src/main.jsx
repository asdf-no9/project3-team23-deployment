import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client'; // Correct import
import './styles/main.css';
import './styles/layout.css';
import {
  BrowserRouter as Router, Routes, Route, Navigate
} from 'react-router-dom'; // Ensure correct import
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.js'; // Importing i18n configuration
import { HighContrastProvider } from './context/highContrast.jsx';
import StartOrder from './pages/startOrder.jsx';
import OrderKiosk from './pages/orderKiosk.jsx';
import Sidebar from './components/sidebar.jsx';
import Login from './pages/login.jsx';
import Cookies from 'js-cookie';
import ManagerInventory from './pages/managerInventory.jsx';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});

function Main() {
  const [loggedInState, setLoggedInState] = useState({
    isLoggedIn: false,
    username: '',
    token: Cookies.get('token') || null,
    manager: false,
    id: -1,
  });

  const logIn = (username, manager, id, token) => {
    setLoggedInState({
      isLoggedIn: true,
      username: username,
      token: token,
      manager: manager,
      id: id
    });
    Cookies.remove('token')
    Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'Strict' });
  }

  const logOut = () => {
    setLoggedInState({
      isLoggedIn: false,
      username: '',
      token: null,
      manager: false,
      id: -1,
    })
    Cookies.remove('token');
  }

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      fetch(import.meta.env.VITE_API_URL + '?token=' + token)
        .then(response => response.json())
        .then((response) => {
          if (response.auth == 0)
            logOut();
          else
            logIn(response.username, response.auth == 2, response.id, token);
        })
        .catch(() => logOut());
    }
  }, []);

  return (
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <HighContrastProvider> { }
          <Router>
            <div id="bodysplit">
              <div className='sidebar'>
                <Sidebar loginInfo={loggedInState} />
              </div>
              <div className='router'>
                <Routes>
                  <Route path="/" element={<StartOrder />} />
                  <Route path="/login" element={<Login loginInfo={loggedInState} logIn={(username, manager, id, token) => logIn(username, manager, id, token)} logOut={() => logOut()} />} />
                  <Route path='/order-kiosk/' element={<OrderKiosk loginInfo={loggedInState} />} />
                  <Route path='/manager-inventory' element={<ManagerInventory />} />
                  <Route path='*' element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </Router>
        </HighContrastProvider>
      </I18nextProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Main />);


export { currencyFormatter };