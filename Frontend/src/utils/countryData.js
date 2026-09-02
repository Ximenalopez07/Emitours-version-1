import { getCountries, getCountryCallingCode } from "libphonenumber-js";

// Generar emoji de bandera a partir del código ISO de 2 letras (ej: 'CO' -> '🇨🇴')
export const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Nombres traducidos de países en Español e Inglés
const countryNames = {
  CO: { es: "Colombia", en: "Colombia" },
  US: { es: "Estados Unidos", en: "United States" },
  MX: { es: "México", en: "Mexico" },
  ES: { es: "España", en: "Spain" },
  AR: { es: "Argentina", en: "Argentina" },
  BR: { es: "Brasil", en: "Brazil" },
  CL: { es: "Chile", en: "Chile" },
  PE: { es: "Perú", en: "Peru" },
  EC: { es: "Ecuador", en: "Ecuador" },
  VE: { es: "Venezuela", en: "Venezuela" },
  UY: { es: "Uruguay", en: "Uruguay" },
  PY: { es: "Paraguay", en: "Paraguay" },
  BO: { es: "Bolivia", en: "Bolivia" },
  CR: { es: "Costa Rica", en: "Costa Rica" },
  PA: { es: "Panamá", en: "Panama" },
  DO: { es: "República Dominicana", en: "Dominican Republic" },
  GT: { es: "Guatemala", en: "Guatemala" },
  HN: { es: "Honduras", en: "Honduras" },
  SV: { es: "El Salvador", en: "El Salvador" },
  NI: { es: "Nicaragua", en: "Nicaragua" },
  CU: { es: "Cuba", en: "Cuba" },
  PR: { es: "Puerto Rico", en: "Puerto Rico" },
  GB: { es: "Reino Unido", en: "United Kingdom" },
  FR: { es: "Francia", en: "France" },
  DE: { es: "Alemania", en: "Germany" },
  IT: { es: "Italia", en: "Italy" },
  PT: { es: "Portugal", en: "Portugal" },
  CA: { es: "Canadá", en: "Canada" },
  JP: { es: "Japón", en: "Japan" },
  CN: { es: "China", en: "China" },
  KR: { es: "Corea del Sur", en: "South Korea" },
  AU: { es: "Australia", en: "Australia" },
  NZ: { es: "Nueva Zelanda", en: "New Zealand" },
  RU: { es: "Rusia", en: "Russia" },
  IN: { es: "India", en: "India" },
  NL: { es: "Países Bajos", en: "Netherlands" },
  CH: { es: "Suiza", en: "Switzerland" },
  BE: { es: "Bélgica", en: "Belgium" },
  SE: { es: "Suecia", en: "Sweden" },
  NO: { es: "Noruega", en: "Norway" },
  DK: { es: "Dinamarca", en: "Denmark" },
  FI: { es: "Finlandia", en: "Finland" },
  PL: { es: "Polonia", en: "Poland" },
  TR: { es: "Turquía", en: "Turkey" },
  IL: { es: "Israel", en: "Israel" },
  ZA: { es: "Sudáfrica", en: "South Africa" }
};

// Generar lista completa de países soportados por libphonenumber-js
export const getAllCountries = (language = "es") => {
  const isEn = language === "en";
  const supported = getCountries();

  const list = supported.map((iso) => {
    let dialCode = "";
    try {
      dialCode = `+${getCountryCallingCode(iso)}`;
    } catch (e) {
      dialCode = "";
    }

    const name = countryNames[iso]?.[isEn ? "en" : "es"] || iso;
    const flag = getCountryFlag(iso);

    return {
      iso,
      name,
      dialCode,
      flag,
      label: `${flag} ${name} (${dialCode})`
    };
  });

  // Países destacados en la parte superior
  const priorityIsos = ["CO", "US", "MX", "ES", "AR", "BR", "CL", "PE", "EC", "VE", "GB", "FR", "DE", "JP"];
  
  const priorityList = list.filter((c) => priorityIsos.includes(c.iso));
  const remainingList = list.filter((c) => !priorityIsos.includes(c.iso));

  priorityList.sort((a, b) => priorityIsos.indexOf(a.iso) - priorityIsos.indexOf(b.iso));
  remainingList.sort((a, b) => a.name.localeCompare(b.name));

  return [...priorityList, ...remainingList];
};
