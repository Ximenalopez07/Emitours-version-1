import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../utils/translations';
import i18n from '../i18n';

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
      localStorage.removeItem("userToken");
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userRole");
      sessionStorage.clear();
      setUserState(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("userToken");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    setUserState(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const setLanguage = (lang) => {
    const safeLang = lang === "en" ? "en" : "es";
    setLanguageState(safeLang);
    localStorage.setItem("language", safeLang);
    // Cambiar idioma mediante i18next de forma desacoplada de la base de datos
    if (i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(safeLang);
    }
  };

  // Aplicar clase al body al cambiar de tema
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  // Sincronizar i18n al montar
  useEffect(() => {
    if (i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // Objeto y función helper de traducción
  const currentLang = language === "en" ? "en" : "es";
  const dict = translations[currentLang] || translations.es;

  const t = (key, fallback) => {
    if (!key) return "";
    return dict[key] !== undefined ? dict[key] : (translations.es[key] !== undefined ? translations.es[key] : (fallback || key));
  };
  // Asignar todas las claves del diccionario a la función 't' para permitir t.propiedad o t("propiedad")
  Object.assign(t, dict);

  return (
    <UIContext.Provider
      value={{
        user,
        setUser,
        logout,
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        i18n,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(UIContext);
  if (!context) {
    const currentLang = localStorage.getItem("language") || "es";
    const dict = translations[currentLang] || translations.es;
    const t = (key, fallback) => {
      if (!key) return "";
      return dict[key] !== undefined ? dict[key] : (translations.es[key] !== undefined ? translations.es[key] : (fallback || key));
    };
    Object.assign(t, dict);
    return {
      t,
      language: currentLang,
      setLanguage: (l) => {
        const safe = l === "en" ? "en" : "es";
        localStorage.setItem("language", safe);
        if (i18n && typeof i18n.changeLanguage === "function") {
          i18n.changeLanguage(safe);
        }
      },
      user: null,
      setUser: () => {},
      logout: () => {},
      i18n
    };
  }
  return {
    ...context,
    t: context.t,
    language: context.language,
    setLanguage: context.setLanguage,
    user: context.user,
    setUser: context.setUser,
    logout: context.logout,
    i18n: context.i18n || i18n
  };
};
