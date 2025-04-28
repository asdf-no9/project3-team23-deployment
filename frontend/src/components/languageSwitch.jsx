import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/languageSwitch.module.css';

/**
 * This component uses the i18next library to provide language switching functionality.
 * @returns LanguageSwitcher component to translate text in the interface
 * Primarily used for translating the sidebar and sub-headers
 * @author Antony Quach
 */

const LanguageSwitcher = ({ changeLanguage, isLangDropdownVisible, setLangDropdownVisible }) => {
  const { t, i18n } = useTranslation('common');


  return (
    <div className={styles.languageDropdownContainer}>
      <button
        className={styles.language}
        onClick={() => setLangDropdownVisible(!isLangDropdownVisible)} //Toggle dropdown visibility
      >
        <i className="fa-solid fa-earth-americas"></i> {t('sidebar.language')}
      </button>
      {isLangDropdownVisible && (
        /*Dropdown for language selection*/
        <div className={styles.languageDropdown}>
          <button onClick={() => changeLanguage('en')}>{t('language.english')}</button>
          <button onClick={() => changeLanguage('es')}>{t('language.spanish')}</button>
        </div>
      )}
    </div>
  );
};

//Export component
export default LanguageSwitcher;