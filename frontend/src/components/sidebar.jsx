import styles from '../styles/sidebar.module.css';
import logo from '../assets/ShareTeaLogo.png';
import { Link } from 'react-router-dom';
import { useHighContrast } from '../context/highContrast.jsx'; //Correct import
import { useTranslation } from 'react-i18next';
import React from 'react';
import LanguageSwitcher from './languageSwitch';

const API_URL = import.meta.env.VITE_API_URL;
/**
 * Used to render the sidebar of the order kiosk interface, which includes logo and category buttons.
 * The sidebar also includes the login and accessibility features.
 * @returns Sidebar component of the order kiosk interface
 * @author Antony Quach
 */

export default function Sidebar({ loginInfo, forecast, changeLanguage, isLangDropdownVisible, setLangDropdownVisible }) {
    const { isHighContrast, toggleTheme } = useHighContrast(); //Correct hook usage
    const { t } = useTranslation('common');
    const [icon, setIcon] = React.useState('');
    React.useEffect(() => {
        fetch(API_URL + 'weather_icon')
            .then(res => res.text())
            .then(data => setIcon(data))
            .catch(err => console.log(err));
    }, []);

    return (

        <div className={styles.sidebarcontent}>
            <div className={styles.sidebarlogocontainer}>
                <Link to="/" title={'Start Order'} >
                    <img src={logo} alt={t('sidebar.logo_alt')} className="logo" />
                </Link>
            </div>
            <div className={styles.middlecontent}>
                <h2 className={'h3 ' + styles.sidebarusername}>{loginInfo.isLoggedIn ? t('hello') + loginInfo.username : t('selfServeKiosk')}</h2>
                <div className={styles.weathericon}>
                    <img src={icon} alt={'Weather Icon'} />
                    <div>
                        <p className={styles.temp}>{forecast.split(", ")[0]}</p>
                        <p className={styles.temp}>{forecast.split(", ")[1]}</p>
                    </div>
                </div>

            </div>

            <div className={styles.accessibleFeatures}>

                {loginInfo.manager ? <>
                    <Link to="/manager-menu"><button tabIndex="-1" className='highContrast'><i class="fa-solid fa-list"></i> Edit Menu</button></Link>
                    <Link to="/manager-inventory"><button tabIndex="-1" className='highContrast'><i class="fa-solid fa-warehouse"></i> Inventory</button></Link>
                    <Link to="/manager-staff"><button tabIndex="-1" className='highContrast'><i class="fa-solid fa-clipboard-user"></i> Manage Staff</button></Link>
                    <Link to="/manager-reports"><button tabIndex="-1" className='highContrast'><i class="fa-solid fa-file"></i> Reports</button></Link>
                    <hr className='' />
                </> : <></>}


                {/*Language Drop-down*/}
                <LanguageSwitcher
                    changeLanguage={changeLanguage}
                    isLangDropdownVisible={isLangDropdownVisible}
                    setLangDropdownVisible={setLangDropdownVisible}
                />

                {/*High-Contrast Toggle*/}
                <button className="highContrast" onClick={toggleTheme}>
                    <i class="fa-solid fa-circle-half-stroke"></i>{isHighContrast ? t('sidebar.disable_high_contrast') : t('sidebar.enable_high_contrast')}
                </button>

                {/*Allergen Filter Button*/}
                {/* <Link to='/allergen-filter'><button tabIndex="-1" className="highContrast"><i class="fa-solid fa-wheat-awn-circle-exclamation"></i> Allergen Filter </button></Link> */}

                {/*Login Button*/}
                <Link to='/login'><button tabIndex="-1" className="highContrast"><i class="fa-solid fa-arrow-right-to-bracket"></i> {!loginInfo.isLoggedIn ? t('sidebar.login') : t('sidebar.logout')}</button></Link>

            </div>
        </div>
    );
}