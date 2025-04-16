import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
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
        Language
      </button>
      {isDropdownVisible && (
        <div className="languageDropdown">
          <button onClick={() => changeLanguage('en')}>English</button>
          <button onClick={() => changeLanguage('es')}>Español</button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;