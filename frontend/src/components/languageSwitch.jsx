import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/languageSwitch.module.css';

/**
 * This component uses the i18next library to provide language switching functionality.
 * @returns LanguageSwitcher component to translate text in the interface
 * Primarily used for translating the sidebar and sub-headers
 * @author Antony Quach
 */

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const [isDropdownVisible, setDropdownVisible] = useState(false); //Set default visibility off

  /**
   * Updates the language based on user selection in the dropdown
   * @param {*} lng The language code to switch to, e.g. 'en' for English or 'es' for Spanish
   */
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownVisible(false); //Hide dropdown after selection
  };

  return (
    <div className={styles.languageDropdownContainer}>
      <button
        className={styles.language}
        onClick={() => setDropdownVisible(!isDropdownVisible)} //Toggle dropdown visibility
      >
        <i class="fa-solid fa-earth-americas"></i> {t('sidebar.language')}
      </button>
      {isDropdownVisible && (
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