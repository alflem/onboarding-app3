"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'sv' | 'no' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('sv'); // Svenska som standard

  // Ladda sparad språkinställning från localStorage när komponenten mountas
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['sv', 'no', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Spara språkinställning till localStorage när den ändras
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Språkdata
export const languages = {
  sv: {
    code: 'sv',
    name: 'Svenska',
    flagComponent: 'SwedishFlag'
  },
  no: {
    code: 'no',
    name: 'Norsk',
    flagComponent: 'NorwegianFlag'
  },
  en: {
    code: 'en',
    name: 'English',
    flagComponent: 'AmericanFlag'
  }
} as const;