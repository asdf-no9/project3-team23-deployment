import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client'; // Correct import
import './styles/main.css';
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
import ManagerMenu from './pages/managerMenu.jsx';
import ManagerReports from './pages/managerReports.jsx';
import ManagerStaff from './pages/manageStaff.jsx';
import { formatInTimeZone } from 'date-fns-tz';
import AllergenFilter from "./pages/allergenFilter.jsx";


/**
 * This is the main render file for the project application
 * It renders the main application and uses react router for routing the pages
 * @author Antony Quach
 * @author Elliot Michlin
 */

const API_URL = import.meta.env.VITE_API_URL;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
});

const getCentralTime = () => {
  const date = new Date();
  return formatInTimeZone(date, 'America/Chicago', 'yyyy-MM-dd');
}

/**
 * Capitalizes every first-letter of a word in a string.
 * @param {string} input The string to modify
 * @returns {string} The new string
 */
const capitalizeEveryWord = (input) => {
  return input
    .split(" ")
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : "")
    .join(" ");
}

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

  const [forecast, setForecast] = useState('');
  const [rec, setRec] = useState('');

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

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {

        const temp = data.temp;
        setForecast(data.weather + ', ' + temp + '°F');
        const msg = "";
        if (temp > 80) {
          setRec(msg + "It's hot out there! How about a drink to cool you down?");
        } else if (temp > 70) {
          setRec(msg + "How about a drink to keep you cool?");
        } else {
          setRec(msg + "Want a drink to warm you up?");
        }

      })
      .catch(err => console.log(err));
  }, []);

  return (
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <HighContrastProvider> { }
          <Router>
            <div id="bodysplit">
              <div className='sidebar'>
                <Sidebar forecast={forecast} loginInfo={loggedInState} />
              </div>
              <div className='router'>
                <Routes>
                  <Route path="/" element={<StartOrder forecast={forecast} rec={rec} />} />
                  <Route path="/login" element={<Login loginInfo={loggedInState} logIn={(username, manager, id, token) => logIn(username, manager, id, token)} logOut={() => logOut()} />} />
                  <Route path='/order-kiosk/' element={<OrderKiosk loginInfo={loggedInState} />} />
                  <Route path='/manager-inventory' element={<ManagerInventory />} />
                  <Route path='/manager-menu' element={<ManagerMenu />} />
                  <Route path='/manager-reports' element={<ManagerReports />} />
                  <Route path='/manager-staff' element={<ManagerStaff />} />
                  <Route path='allergen-filter' element={<AllergenFilter />} />
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


export { currencyFormatter, getCentralTime, capitalizeEveryWord };