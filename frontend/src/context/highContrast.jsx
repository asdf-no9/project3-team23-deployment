import { createContext, useState, useContext, useEffect } from 'react';

const HighContrastContext = createContext();

/**
 * This component provides a context for managing the high-contrast theme toggle.
 * Primarily used for accessibility purposes: Visual impairement.
 * @returns HighContrastProvider component
 * @author Antony Quach
 */
export function HighContrastProvider({ children }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  /**
   * Toggles high contrast mode to switch back and forth
   */
  const toggleTheme = () => {
    setIsHighContrast((prev) => !prev);
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

/**
 * @returns A wrapper around the high contrast context object
 */
export function useHighContrast() {
  return useContext(HighContrastContext);
}