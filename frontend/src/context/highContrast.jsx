import { createContext, useState, useContext, useEffect } from 'react';

const HighContrastContext = createContext();

export function HighContrastProvider({ children }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  const toggleTheme = () => {
    setIsHighContrast((prev) => !prev);
  };

  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <HighContrastContext.Provider value={{ isHighContrast, toggleTheme }}>
      {children}
    </HighContrastContext.Provider>
  );
}

export function useHighContrast() {
  return useContext(HighContrastContext);
}