import React, { useState, useEffect, useRef, useContext } from "react";
import "./InicioSeccion.css";
import {
  googleLoginUsuario,
  googleRegisterInitUsuario,
  googleRegisterUsuario
} from "../api";
import { UIContext } from "../context/UIContext";
import { AdminAuthContext } from "../context/AdminAuthContext";
import { FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { getAllCountries } from "../utils/countryData";
import PhoneInput from "../components/PhoneInput";
import logo from "../assets/logo.jpg";

// Helper frontend de validación de documento según País + Tipo + Número
function validarDocumentoFrontend(pais, tipoDocumento, numero, t, language) {
  if (!numero || typeof numero !== "string" || !numero.trim()) {
    return { valido: false, mensaje: t?.auth_err_doc_req || "El número de documento es obligatorio." };
  }
  if (numero.includes(" ")) {
    return { valido: false, mensaje: t?.auth_err_doc_nospaces || "El número de documento no puede contener espacios." };
  }

  const paisNorm = (pais || "Colombia").trim().toLowerCase();
  const tipoNorm = (tipoDocumento || "Cédula de ciudadanía").trim().toLowerCase();
  const numClean = numero.trim();

  if (paisNorm === "colombia") {
    if (tipoNorm.includes("ciudadanía") || tipoNorm.includes("ciudadania")) {
      if (!/^\d{6,10}$/.test(numClean)) {
        return {
          valido: false,
          mensaje: language === "en" ? "Citizenship ID must contain 6 to 10 digits without letters." : "La cédula de ciudadanía debe contener entre 6 y 10 dígitos numéricos sin letras."
        };
      }
      if (/^(\d)\1+$/.test(numClean)) {
        return { valido: false, mensaje: language === "en" ? "The ID number entered is invalid." : "El número de cédula ingresado no es válido." };
      }
      return { valido: true, numeroNormalizado: numClean };
    } else if (tipoNorm.includes("extranjería") || tipoNorm.includes("extranjeria")) {
      if (!/^[A-Za-z0-9]{6,10}$/.test(numClean)) {
        return {
          valido: false,
          mensaje: language === "en" ? "Foreign ID must contain 6 to 10 alphanumeric characters." : "La cédula de extranjería debe contener entre 6 y 10 caracteres alfanuméricos."
        };
      }
      return { valido: true, numeroNormalizado: numClean.toUpperCase() };
    } else if (tipoNorm.includes("pasaporte") || tipoNorm.includes("passport")) {
      if (!/^[A-Za-z0-9]{6,15}$/.test(numClean)) {
        return {
          valido: false,
          mensaje: language === "en" ? "Passport must contain 6 to 15 alphanumeric characters." : "El pasaporte debe contener entre 6 y 15 caracteres alfanuméricos."
        };
      }
      return { valido: true, numeroNormalizado: numClean.toUpperCase() };
    }
  }

  // Otros países
  if (tipoNorm.includes("pasaporte") || tipoNorm.includes("passport")) {
    if (!/^[A-Za-z0-9]{6,15}$/.test(numClean)) {
      return {
        valido: false,
        mensaje: language === "en" ? "International passport must contain 6 to 15 alphanumeric characters." : "El pasaporte internacional debe contener entre 6 y 15 caracteres alfanuméricos."
      };
    }
    return { valido: true, numeroNormalizado: numClean.toUpperCase() };
  } else {
    if (!/^[A-Za-z0-9\-]{5,20}$/.test(numClean)) {
      return {
        valido: false,
        mensaje: language === "en" ? "Identity document must contain 5 to 20 characters without spaces." : "El documento de identificación debe contener entre 5 y 20 caracteres sin espacios."
      };
    }
    return { valido: true, numeroNormalizado: numClean.toUpperCase() };
  }
}

function InicioSeccion() {
  const { user, setUser, language, t } = useContext(UIContext);
  const { login: adminLoginSubmit } = useContext(AdminAuthContext);

  // Vistas principales: false = Iniciar sesión, true = Crear cuenta
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  // Vista del formulario exclusivo de Administrador
  const [vistaAdmin, setVistaAdmin] = useState(false);

  // Estados generales de carga y alertas
  const [cargando, setCargando] = useState(false);
  const [alertaGeneral, setAlertaGeneral] = useState(null);

  // ================= ESTADOS DEL REGISTRO COMPLEMENTARIO =================
  // Almacena temporalmente la credencial de Google verificada sin crear aún el usuario en BD
  const [googleIdToken, setGoogleIdToken] = useState(null);
  const [googleUser, setGoogleUser] = useState(null);

  const [nombreUsuario, setNombreUsuario] = useState("");
  const [selectedCountryIso, setSelectedCountryIso] = useState("CO");
  const [tipoDocumento, setTipoDocumento] = useState("Cédula de ciudadanía");
  const [cedula, setCedula] = useState("");
  const [phoneData, setPhoneData] = useState({
    fullE164: "",
    country: "CO",
    rawNumber: "",
    isValid: false
  });
  const [erroresFormulario, setErroresFormulario] = useState({});

  // ================= ESTADOS DEL FORMULARIO ADMINISTRADOR =================
  const [adminCorreo, setAdminCorreo] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [cargandoAdmin, setCargandoAdmin] = useState(false);

  // Referencia para renderizar el botón oficial de Google Identity Services
  const googleBtnRef = useRef(null);

  // Lista de países disponibles
  const countries = getAllCountries(language);
  const selectedCountryObj =
    countries.find((c) => c.iso === selectedCountryIso) || countries[0];

  // Adaptar tipo de documento según el país seleccionado
  useEffect(() => {
    if (selectedCountryIso === "CO") {
      setTipoDocumento("Cédula de ciudadanía");
    } else {
      setTipoDocumento("Pasaporte");
    }
    setErroresFormulario((prev) => ({ ...prev, cedula: null }));
  }, [selectedCountryIso]);

  // Cambiar entre vista de Login y Registro
  const handleCambiarARegistro = () => {
    setMostrarRegistro(true);
    setVistaAdmin(false);
    setAlertaGeneral(null);
    setErroresFormulario({});
  };

  const handleCambiarALogin = () => {
    setMostrarRegistro(false);
    setVistaAdmin(false);
    setAlertaGeneral(null);
    setGoogleIdToken(null);
    setGoogleUser(null);
    setErroresFormulario({});
  };

  // ================= RESPUESTA DE GOOGLE IDENTITY SERVICES (GIS) =================
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setAlertaGeneral({
        tipo: "error",
        texto: "No se recibió una credencial válida desde Google."
      });
      return;
    }

    setCargando(true);
    setAlertaGeneral(null);

    // Decodificar token de Google para obtener picture de respaldo
    let decodedPicture = null;
    try {
      const parts = response.credential.split(".");
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        decodedPicture = decoded.picture || null;
      }
    } catch (e) {
      console.warn("No se pudo decodificar payload de Google en frontend:", e);
    }

    try {
      if (!mostrarRegistro) {
        // ================= CASO 1: LOGIN =================
        // Verifica si existe el usuario. Si no existe, NO crea usuario y muestra mensaje.
        const res = await googleLoginUsuario({ idToken: response.credential });

        if (res.data && res.data.status === "OK") {
          const rawUser = res.data.user;
          const userPhoto = rawUser.picture || rawUser.foto || decodedPicture || null;
          const userObj = {
            ...rawUser,
            foto: userPhoto,
            picture: userPhoto
          };
          localStorage.setItem("userToken", res.data.token || JSON.stringify(userObj));
          localStorage.setItem("usuario", JSON.stringify(userObj));
          setUser(userObj);
          window.location.href = "/";
        } else {
          setAlertaGeneral({
            tipo: "error",
            texto: res.data?.mensaje || "Error al procesar el inicio de sesión con Google."
          });
        }
      } else {
        // ================= CASO 2: REGISTRO (PASO 1 - IDENTIFICACIÓN) =================
        // Comprueba si ya existe. Si no existe, NO lo crea en BD todavía.
        const res = await googleRegisterInitUsuario({ idToken: response.credential });

        if (res.data && res.data.status === "PENDIENTE_DATOS") {
          setGoogleIdToken(response.credential);
          setGoogleUser(res.data.googleUser);

          // Si Google devuelve el nombre, precargarlo automáticamente
          if (res.data.googleUser?.name && !nombreUsuario) {
            setNombreUsuario(res.data.googleUser.name);
          }

          setAlertaGeneral({
            tipo: "exito",
            texto: `✓ Cuenta de Google vinculada (${res.data.googleUser.email}). Completa los siguientes datos para finalizar tu registro.`
          });
        } else {
          setAlertaGeneral({
            tipo: "error",
            texto: res.data?.mensaje || "Error al verificar la cuenta de Google."
          });
        }
      }
    } catch (error) {
      console.error("Error en autenticación con Google:", error);
      const data = error.response?.data;
      if (data && data.status === "NO_REGISTRADO") {
        setAlertaGeneral({
          tipo: "error",
          texto: data.mensaje || "Esta cuenta todavía no está registrada en EmiTours.",
          accion: "ir_registro"
        });
      } else if (data && data.status === "YA_REGISTRADO") {
        setAlertaGeneral({
          tipo: "error",
          texto: data.mensaje || "Esta cuenta de Google ya está registrada en EmiTours.",
          accion: "ir_login"
        });
      } else {
        const msgError =
          data?.mensaje || error.message || "Error al comunicarse con el servidor.";
        setAlertaGeneral({ tipo: "error", texto: msgError });
      }
    } finally {
      setCargando(false);
    }
  };

  // Inicializar y renderizar botón oficial de Google Identity Services
  useEffect(() => {
    if (vistaAdmin) return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      "174516962308-g0rjf27noviovrm467e0avo4fa3lklb9.apps.googleusercontent.com";

    let timer = null;

    const setupGoogleAuth = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: mostrarRegistro ? "signup_with" : "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 300
          });
        } catch (err) {
          console.error("Error al inicializar Google Identity Services:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleAuth();
    } else {
      timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleAuth();
        }
      }, 150);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mostrarRegistro, vistaAdmin]);

  // ================= ENVÍO FINAL DEL REGISTRO =================
  const handleCompletarRegistroSubmit = async (e) => {
    e.preventDefault();
    setAlertaGeneral(null);
    setErroresFormulario({});

    // 1. Verificar que se haya autenticado primero con Google
    if (!googleIdToken) {
      setAlertaGeneral({
        tipo: "error",
        texto: t?.auth_err_google_first || "Primero debes identificarte con tu cuenta de Google mediante el botón de arriba."
      });
      return;
    }

    const nuevosErrores = {};

    // 2. Validar Nombre
    const nombreClean = nombreUsuario.trim();
    if (!nombreClean) {
      nuevosErrores.nombre = t?.auth_err_fullname_req || "El nombre completo es obligatorio.";
    } else if (nombreUsuario.startsWith(" ") || nombreUsuario.endsWith(" ")) {
      nuevosErrores.nombre = language === "en" ? "Name cannot start or end with spaces." : "El nombre no puede comenzar ni terminar con espacios.";
    } else {
      const regexNombre = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
      if (!regexNombre.test(nombreClean)) {
        nuevosErrores.nombre = t?.auth_err_fullname_invalid || "Ingresa un nombre válido (solo letras y espacios).";
      }
    }

    // 3. Validar Documento
    const paisNombre = selectedCountryObj?.name || "Colombia";
    const validacionDoc = validarDocumentoFrontend(paisNombre, tipoDocumento, cedula, t, language);
    if (!validacionDoc.valido) {
      nuevosErrores.cedula = validacionDoc.mensaje;
    }

    // 4. Validar Teléfono
    if (!phoneData.rawNumber) {
      nuevosErrores.telefono = t?.auth_err_phone_req || "El teléfono / celular es obligatorio.";
    } else if (!phoneData.isValid) {
      nuevosErrores.telefono = t?.auth_err_phone_invalid || "Ingresa un número de teléfono válido para el país seleccionado.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresFormulario(nuevosErrores);
      return;
    }

    setCargando(true);

    try {
      const res = await googleRegisterUsuario({
        idToken: googleIdToken,
        nombre_usuario: nombreClean,
        pais: paisNombre,
        tipo_documento: tipoDocumento,
        cedula: validacionDoc.numeroNormalizado,
        telefono: phoneData.fullE164
      });

      if (res.data && res.data.status === "OK") {
        const rawUser = res.data.user;
        const userPhoto = rawUser.picture || rawUser.foto || googleUser?.picture || null;
        const userObj = {
          ...rawUser,
          foto: userPhoto,
          picture: userPhoto
        };
        localStorage.setItem("userToken", res.data.token || JSON.stringify(userObj));
        localStorage.setItem("usuario", JSON.stringify(userObj));
        setUser(userObj);
        window.location.href = "/";
      } else {
        setAlertaGeneral({
          tipo: "error",
          texto: res.data?.mensaje || (language === "en" ? "Error completing registration." : "Error al completar el registro.")
        });
      }
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      const data = err.response?.data;
      if (data && data.status === "YA_REGISTRADO") {
        setAlertaGeneral({
          tipo: "error",
          texto: data.mensaje || (language === "en" ? "This Google account is already registered." : "Esta cuenta de Google ya está registrada en EmiTours."),
          accion: "ir_login"
        });
      } else {
        const msg = data?.mensaje || err.message || (language === "en" ? "Error creating account." : "Error al crear la cuenta.");
        setAlertaGeneral({ tipo: "error", texto: msg });
      }
    } finally {
      setCargando(false);
    }
  };

  // ================= FORMULARIO ADMINISTRATIVO =================
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAlertaGeneral(null);

    if (!adminCorreo || !adminPass) {
      setAlertaGeneral({
        tipo: "error",
        texto: language === "en" ? "You must enter your admin email and password." : "Debes ingresar tu correo y contraseña de administrador."
      });
      return;
    }

    setCargandoAdmin(true);

    try {
      await adminLoginSubmit(adminCorreo.trim(), adminPass);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error("Error en login de administrador:", err);
      const msg =
        err.response?.data?.mensaje ||
        err.message ||
        (language === "en" ? "Incorrect administrative credentials." : "Credenciales administrativas incorrectas.");
      setAlertaGeneral({ tipo: "error", texto: msg });
    } finally {
      setCargandoAdmin(false);
    }
  };

  return (
    <div className="auth-clean-container">
      <div className={`auth-clean-card ${mostrarRegistro ? "card-registro" : "card-login"}`}>
        {/* LOGO OFICIAL DE EMITOURS */}
        <div className="auth-logo-header">
          <img src={logo} alt="Logo EmiTours" className="auth-clean-logo" />
        </div>

        {/* ALERTA DE MENSAJES Y ERRORES */}
        {alertaGeneral && (
          <div className={`auth-alert-box ${alertaGeneral.tipo}`}>
            <p>{alertaGeneral.texto}</p>
            {alertaGeneral.accion === "ir_registro" && (
              <button
                type="button"
                className="alert-action-btn"
                onClick={handleCambiarARegistro}
              >
                {t?.auth_login_create_account || "Crear cuenta"} →
              </button>
            )}
            {alertaGeneral.accion === "ir_login" && (
              <button
                type="button"
                className="alert-action-btn"
                onClick={handleCambiarALogin}
              >
                {t?.auth_sign_in_link || "Iniciar sesión"} →
              </button>
            )}
          </div>
        )}

        {/* ==================================================
            1. PANTALLA DE ACCESO ADMINISTRATIVO
            ================================================== */}
        {vistaAdmin ? (
          <div className="auth-view-block">
            <h1 className="auth-main-title">{t?.auth_admin_title || "ACCESO ADMINISTRADOR"}</h1>
            <p className="auth-sub-title">
              {t?.auth_admin_subtitle || "Ingresa con tus credenciales administrativas autorizadas"}
            </p>

            <form onSubmit={handleAdminSubmit} className="auth-form" noValidate>
              <div className="auth-field-group">
                <label className="auth-label">{t?.reg_correo || "Correo electrónico"} *</label>
                <input
                  type="email"
                  placeholder="admin@emitours.com"
                  value={adminCorreo}
                  onChange={(e) => setAdminCorreo(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">{t?.reg_pass || "Contraseña"} *</label>
                <div className="auth-pass-wrapper">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="auth-input"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    title={showAdminPass ? (t?.ocultar_pass || "Ocultar") : (t?.mostrar_pass || "Mostrar")}
                  >
                    {showAdminPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={cargandoAdmin}
              >
                {cargandoAdmin ? (t?.auth_admin_loading || "Iniciando sesión...") : (t?.auth_admin_btn || "INICIAR SESIÓN")}
              </button>
            </form>

            <button
              type="button"
              className="auth-back-link"
              onClick={() => {
                setVistaAdmin(false);
                setAlertaGeneral(null);
                setAdminPass("");
              }}
            >
              {t?.auth_admin_back || "← Volver"}
            </button>
          </div>
        ) : !mostrarRegistro ? (
          /* ==================================================
             2. PANTALLA DE INICIAR SESIÓN (IMAGEN DE REFERENCIA 1)
             ================================================== */
          <div className="auth-view-block">
            <h1 className="auth-main-title">{t?.auth_login_title || "Iniciar sesión en EmiTours"}</h1>
            <p className="auth-sub-title">
              {t?.auth_login_subtitle || "Accede a tu cuenta para explorar nuestros tours y realizar reservas."}
            </p>

            {/* BOTÓN OFICIAL DE GOOGLE (CONTINUAR CON GOOGLE) */}
            <div className="google-gis-container">
              <div ref={googleBtnRef} id="google-login-btn"></div>
            </div>

            {cargando && (
              <p className="auth-loading-text">{t?.auth_login_loading || "Conectando con Google..."}</p>
            )}

            {/* SEPARADOR: ────────── o ────────── */}
            <div className="auth-divider">
              <span>{language === "en" ? "or" : "o"}</span>
            </div>

            {/* ¿Nuevo en EmiTours? Crear cuenta */}
            <div className="auth-toggle-row">
              <span className="auth-toggle-question">{t?.auth_login_new_question || "¿Nuevo en EmiTours?"}</span>
              <button
                type="button"
                className="auth-toggle-action-btn"
                onClick={handleCambiarARegistro}
              >
                {t?.auth_login_create_account || "Crear cuenta"}
              </button>
            </div>

            {/* SECCIÓN ADMINISTRADOR */}
            <div className="admin-access-section">
              <span className="admin-access-label">{t?.auth_admin_question || "¿Eres administrador?"}</span>
              <button
                type="button"
                className="admin-access-pill-btn"
                onClick={() => {
                  setVistaAdmin(true);
                  setAlertaGeneral(null);
                }}
              >
                {t?.auth_admin_access || "Acceso administrativo"}
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================
             3. PANTALLA CREAR CUENTA (IMAGEN DE REFERENCIA 2)
             ================================================== */
          <div className="auth-view-block">
            <h1 className="auth-main-title">{t?.auth_reg_title || "Crear cuenta en EmiTours"}</h1>
            <p className="auth-sub-title">
              {t?.auth_reg_subtitle || "Regístrate con tu cuenta de Google y completa tus datos para comenzar."}
            </p>

            {/* BOTÓN OFICIAL DE GOOGLE (REGISTRARSE CON GOOGLE) */}
            <div className="google-gis-container">
              <div ref={googleBtnRef} id="google-register-btn"></div>
            </div>

            {googleUser && (
              <div className="google-connected-pill">
                <FaCheckCircle className="check-icon" />
                <span>{t?.auth_reg_connected || "Google conectado:"} <strong>{googleUser.email}</strong></span>
              </div>
            )}

            {/* SEPARADOR: ────────── o ────────── */}
            <div className="auth-divider">
              <span>{language === "en" ? "or" : "o"}</span>
            </div>

            {/* SECCIÓN: COMPLETA TUS DATOS */}
            <div className="register-details-header">
              <h2 className="register-details-title">{t?.auth_reg_complete_title || "Completa tus datos"}</h2>
              <p className="register-details-desc">
                {t?.auth_reg_complete_desc || "Necesitamos algunos datos adicionales para crear tu cuenta."}
              </p>
            </div>

            <form onSubmit={handleCompletarRegistroSubmit} className="auth-form" noValidate>
              {/* NOMBRE COMPLETO * */}
              <div className="auth-field-group">
                <label className="auth-label">{t?.auth_lbl_fullname || "NOMBRE COMPLETO *"}</label>
                <input
                  type="text"
                  placeholder={language === "en" ? "Your full name" : "Tu nombre completo"}
                  value={nombreUsuario}
                  onChange={(e) => {
                    setNombreUsuario(e.target.value);
                    if (erroresFormulario.nombre) {
                      setErroresFormulario((prev) => ({ ...prev, nombre: null }));
                    }
                  }}
                  className={`auth-input ${erroresFormulario.nombre ? "input-has-error" : ""}`}
                />
                {erroresFormulario.nombre && (
                  <span className="auth-field-error">{erroresFormulario.nombre}</span>
                )}
              </div>

              {/* PAÍS * */}
              <div className="auth-field-group">
                <label className="auth-label">{t?.auth_lbl_country || "PAÍS *"}</label>
                <select
                  value={selectedCountryIso}
                  onChange={(e) => setSelectedCountryIso(e.target.value)}
                  className="auth-select"
                >
                  {countries.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO DE DOCUMENTO * */}
              <div className="auth-field-group">
                <label className="auth-label">{t?.auth_lbl_doctype || "TIPO DE DOCUMENTO *"}</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="auth-select"
                >
                  {selectedCountryIso === "CO" ? (
                    <>
                      <option value="Cédula de ciudadanía">{t?.doc_cedula_ciudadania || "Cédula de ciudadanía"}</option>
                      <option value="Cédula de extranjería">{t?.doc_cedula_extranjeria || "Cédula de extranjería"}</option>
                      <option value="Pasaporte">{t?.doc_pasaporte || "Pasaporte"}</option>
                    </>
                  ) : (
                    <>
                      <option value="Pasaporte">{t?.doc_pasaporte || "Pasaporte"}</option>
                      <option value="Documento Nacional de Identidad / Cédula">
                        {t?.doc_dni_otro || "Documento Nacional de Identidad / Cédula"}
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* NÚMERO DE DOCUMENTO * */}
              <div className="auth-field-group">
                <label className="auth-label">{t?.auth_lbl_docnum || "NÚMERO DE DOCUMENTO *"}</label>
                <input
                  type="text"
                  placeholder={
                    selectedCountryIso === "CO" && tipoDocumento.includes("ciudadanía")
                      ? (language === "en" ? "Ex: 1020304050" : "Ej: 1020304050")
                      : (language === "en" ? "Ex: AB123456" : "Ej: AB123456")
                  }
                  value={cedula}
                  onChange={(e) => {
                    setCedula(e.target.value);
                    if (erroresFormulario.cedula) {
                      setErroresFormulario((prev) => ({ ...prev, cedula: null }));
                    }
                  }}
                  className={`auth-input ${erroresFormulario.cedula ? "input-has-error" : ""}`}
                />
                {erroresFormulario.cedula && (
                  <span className="auth-field-error">{erroresFormulario.cedula}</span>
                )}
              </div>

              {/* TELÉFONO / CELULAR * */}
              <div className="auth-field-group">
                <label className="auth-label">{t?.auth_lbl_phone || "TELÉFONO / CELULAR *"}</label>
                <PhoneInput
                  defaultCountry={selectedCountryIso}
                  value={phoneData.fullE164}
                  onChange={(data) => {
                    setPhoneData(data);
                    if (erroresFormulario.telefono) {
                      setErroresFormulario((prev) => ({ ...prev, telefono: null }));
                    }
                  }}
                  placeholder={language === "en" ? "Ex: 312 345 6789" : "Ej: 312 345 6789"}
                  errorText={erroresFormulario.telefono}
                />
              </div>

              {/* BOTÓN COMPLETAR REGISTRO */}
              <button
                type="submit"
                className="auth-btn-primary"
                disabled={cargando}
              >
                {cargando ? (t?.auth_btn_completing || "Completando registro...") : (t?.auth_btn_complete || "Completar registro")}
              </button>
            </form>

            {/* ¿Ya tienes cuenta? Inicia sesión */}
            <div className="auth-toggle-row mt-3">
              <span className="auth-toggle-question">{t?.auth_already_have_acc || "¿Ya tienes cuenta?"}</span>
              <button
                type="button"
                className="auth-toggle-action-btn"
                onClick={handleCambiarALogin}
              >
                {t?.auth_sign_in_link || "Inicia sesión"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InicioSeccion;