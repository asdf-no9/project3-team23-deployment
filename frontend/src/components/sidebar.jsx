import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { useLocation, Link, useParams } from 'react-router-dom';
import { useHighContrast } from '../context/highContrast.jsx'; //Correct import
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import LanguageSwitcher from './languageSwitch';


export default function Sidebar({ loginInfo }) {
    const { isHighContrast, toggleTheme } = useHighContrast(); //Correct hook usage
    const { t, i18n } = useTranslation('common');

    return (

        <div className="sidebarContent">
            <div className="sidebarlogocontainer">
                <Link to="/" >
                    <img src={logo} alt={t('sidebar.logo_alt')} className="logo" />
                </Link>
            </div>
            <h2 className='h3 sidebarusername'>{loginInfo.isLoggedIn ? "Hello, " + loginInfo.username : "Self-Serve Kiosk"}</h2>
            <div className="accessibleFeatures">

                {loginInfo.manager ? <>
                    <button className='highContrast'>Edit Menu</button>
                    <button className='highContrast'>Inventory</button>
                    <button className='highContrast'>Manage Staff</button>
                    <button className='highContrast'>Reports</button>

                    <hr />
                </> : <></>}


                {/*Language Drop-down*/}
                <LanguageSwitcher />

                {/*High-Contrast Toggle*/}
                <button className="highContrast" onClick={toggleTheme}>
                    {isHighContrast ? t('sidebar.disable_high_contrast') : t('sidebar.enable_high_contrast')}
                </button>

                {/*Login Button*/}
                <Link to='/login'><button className="highContrast">{!loginInfo.isLoggedIn ? t('sidebar.login') : 'Logout'}</button></Link>

            </div>
        </div>
    );
}