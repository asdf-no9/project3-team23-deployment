import { createContext, useState, useContext, useEffect } from 'react';

/**
 * This component provides a context for managing the high-contrast theme toggle.
 * Primarily used for accessibility purposes: Visual impairement.
 * @returns HighContrastProvider component
 * @author Antony Quach
 */

const HighContrastContext = createContext();

export function HighContrastProvider({ children }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  const toggleTheme = () => {
    setIsHighContrast((prev) => !prev); //Toggle high-contrast mode to switch back and forth
  };

  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast'); //Apply high-contrast to interface
    } else {
      document.body.classList.remove('high-contrast'); //Remove high-contrast from interface
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