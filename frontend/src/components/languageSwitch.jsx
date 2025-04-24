import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../styles/languageSwitch.module.css';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const [isDropdownVisible, setDropdownVisible] = useState(false);

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
        {t('sidebar.language')}
      </button>
      {isDropdownVisible && (
        <div className={styles.languageDropdown}>
          <button onClick={() => changeLanguage('en')}>{t('language.english')}</button>
          <button onClick={() => changeLanguage('es')}>{t('language.spanish')}</button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;