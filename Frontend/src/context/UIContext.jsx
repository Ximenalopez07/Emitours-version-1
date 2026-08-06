import React, { createContext, useState, useEffect } from 'react';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("language") || "es";
  });

  const setUser = (userData) => {
    if (userData) {
      localStorage.setItem("usuario", JSON.stringify(userData));
      setUserState(userData);
    } else {
      localStorage.removeItem("usuario");
      setUserState(null);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Aplicar clase al body al cambiar de tema
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  return (
    <UIContext.Provider
      value={{
        user,
        setUser,
        theme,
        toggleTheme,
        language,
        setLanguage,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
