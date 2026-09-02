import React, { useState, useEffect, useContext } from "react";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";
import { getAllCountries, getCountryFlag } from "../utils/countryData";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import "./PhoneInput.css";

export default function PhoneInput({
  value = "",
  onChange,
  required = false,
  placeholder = "Ej: 3018640872",
  defaultCountry = "CO",
  errorText = null
}) {
  const { language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [touched, setTouched] = useState(false);

  const countries = getAllCountries(language);

  // Analizar el valor inicial si viene en formato E.164 (ej: +573018640872)
  useEffect(() => {
    if (value && typeof value === "string" && value.startsWith("+")) {
      try {
        const parsed = parsePhoneNumberFromString(value);
        if (parsed) {
          if (parsed.country) setSelectedCountry(parsed.country);
          setNationalNumber(parsed.nationalNumber || "");
          return;
        }
      } catch (e) {
        console.warn("No se pudo parsear número inicial E.164:", value);
      }
    }
    // Si es un número sin signo +
    if (value && !value.startsWith("+")) {
      const soloNumeros = value.replace(/[^0-9]/g, "");
      setNationalNumber(soloNumeros);
    }
  }, [value]);

  // Re-validar cuando cambia el número o el país seleccionado
  useEffect(() => {
    validateAndEmit(nationalNumber, selectedCountry);
  }, [nationalNumber, selectedCountry]);

  const validateAndEmit = (num, countryIso) => {
    const cleanNum = num.replace(/[^0-9]/g, "");

    if (!cleanNum) {
      const valid = !required;
      setIsValid(valid);
      setLocalError(required && touched ? t.error_telefono_obligatorio || "El número de teléfono es obligatorio." : null);
      if (onChange) {
        onChange({
          fullE164: "",
          country: countryIso,
          rawNumber: "",
          isValid: valid
        });
      }
      return;
    }

    let valid = false;
    let fullE164 = "";

    try {
      valid = isValidPhoneNumber(cleanNum, countryIso);
      const parsed = parsePhoneNumberFromString(cleanNum, countryIso);
      if (parsed && valid) {
        fullE164 = parsed.format("E.164");
      }
    } catch (e) {
      valid = false;
    }

    setIsValid(valid);
    setLocalError(valid ? null : t.error_telefono_valido || "Ingresa un número de teléfono válido.");

    if (onChange) {
      onChange({
        fullE164,
        country: countryIso,
        rawNumber: cleanNum,
        isValid: valid
      });
    }
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    setTouched(true);
  };

  const handleNumberChange = (e) => {
    // Permitir ingresar únicamente números
    const clean = e.target.value.replace(/[^0-9]/g, "");
    setNationalNumber(clean);
    setTouched(true);
  };

  const activeCountryObj = countries.find((c) => c.iso === selectedCountry) || countries[0];

  return (
    <div className="phone-input-component">
      <div className={`phone-input-row ${(!isValid && touched) || errorText ? "invalid" : isValid && nationalNumber ? "valid" : ""}`}>
        {/* SELECTOR DE PAÍS CON BANDERA */}
        <div className="country-select-wrapper">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="country-select"
          >
            {countries.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="selected-flag-preview">{getCountryFlag(selectedCountry)}</span>
        </div>

        {/* CAMPO DE NÚMERO DE TELÉFONO */}
        <div className="number-input-wrapper">
          <span className="dial-code-prefix">{activeCountryObj?.dialCode}</span>
          <input
            type="tel"
            value={nationalNumber}
            onChange={handleNumberChange}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            className="phone-field"
          />
          {isValid && nationalNumber && (
            <span className="valid-icon" title="Número válido">✓</span>
          )}
        </div>
      </div>

      {/* ERROR DE VALIDACIÓN DEBAJO DEL CAMPO */}
      {((!isValid && touched && localError) || errorText) && (
        <span className="phone-error-message">
          {errorText || localError}
        </span>
      )}
    </div>
  );
}
