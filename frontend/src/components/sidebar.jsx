import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { useLocation, Link } from 'react-router-dom';
import { useHighContrast } from '../context/highContrast.jsx'; //Correct import
import { useTranslation } from 'react-i18next'; //Importing i18n for translation
import React, { useState } from 'react';
import LanguageSwitcher from './languageSwitch'; //Importing language translation module
import Cookies from 'js-cookie';

/**
 * Used to render the sidebar of the order kiosk interface, which includes logo and category buttons.
 * The sidebar also includes the login and accessibility features.
 * @returns Sidebar component of the order kiosk interface
 * @author Antony Quach
 */

export default function Sidebar() {
    const { isHighContrast, toggleTheme } = useHighContrast(); //Correct hook usage
    const { t, i18n } = useTranslation('common'); //Used in i18n for translation

    return (

        <div className="sidebarContent">
            <div className="sidebarlogocontainer">
                <Link to="/" >
                    <img src={logo} alt={t('sidebar.logo_alt')} className="logo" />
                </Link>
            </div>
            <div className="accessibleFeatures">

                {/*Language Drop-down*/}
                <LanguageSwitcher />

                {/*High-Contrast Toggle*/}
                <button className="highContrast" onClick={toggleTheme}>
                    {isHighContrast ? t('sidebar.disable_high_contrast') : t('sidebar.enable_high_contrast')}
                </button>
                {/*Login Button*/}
                <Link to='/login'><button className="highContrast">{t('sidebar.login')}</button></Link>

            </div>
        </div>
    );
}