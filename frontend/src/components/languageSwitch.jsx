import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation('common');
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownVisible(false); //Hide dropdown after selection
  };

  return (
    <div className="languageDropdownContainer">
      <button
        className="language"
        onClick={() => setDropdownVisible(!isDropdownVisible)} //Toggle dropdown visibility
      >
        {t('sidebar.language')}
      </button>
      {isDropdownVisible && (

        /*Dropdown for language selection*/
        <div className="languageDropdown"> 
          <button onClick={() => changeLanguage('en')}>{t('language.english')}</button>
          <button onClick={() => changeLanguage('es')}>{t('language.spanish')}</button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;