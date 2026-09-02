import React, { useState, useContext } from "react";
import "./inicioseccion.css";
import { loginUsuario, registroUsuario } from "../api";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "../components/PhoneInput";

function InicioSeccion() {
  const { setUser, language } = useContext(UIContext);
  const t = translations[language] || translations.es;

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [alertaGeneral, setAlertaGeneral] = useState(null);

  // ================= CAMPOS REGISTRO =================
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("20");
  const [sexo, setSexo] = useState("Femenino");
  const [cedula, setCedula] = useState("");
  const [telefonoE164, setTelefonoE164] = useState("");
  const [isTelefonoValid, setIsTelefonoValid] = useState(true);
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Eye toggles para mostrar/ocultar contraseñas
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  // ================= CAMPOS LOGIN =================
  const [loginCorreo, setLoginCorreo] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ================= ERRORES DE CAMPO EN TIEMPO REAL =================
  const [erroresReg, setErroresReg] = useState({});
  const [erroresLog, setErroresLog] = useState({});

  // ================= REGEX =================
  const regexNombre = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/;
  const regexCedula = /^[0-9]{5,12}$/;
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const toggleVista = () => {
    setMostrarRegistro(!mostrarRegistro);
    setAlertaGeneral(null);
    setErroresReg({});
    setErroresLog({});
  };

  // Bloquear la tecla espacio directamente en teclado para correo y contraseña
  const handleKeyDownNoSpace = (e, setFieldErr, fieldKey, errorMsg) => {
    if (e.key === ' ') {
      e.preventDefault();
      setFieldErr((prev) => ({ ...prev, [fieldKey]: errorMsg }));
    }
  };

  // ================= VALIDACIÓN EN TIEMPO REAL REGISTRO =================
  const handleNombreChange = (val) => {
    setNombre(val);
    let err = null;
    if (val.startsWith(" ") && val.endsWith(" ")) {
      err = t.error_nombre_espacio_ambos;
    } else if (val.startsWith(" ")) {
      err = t.error_nombre_espacio_inicio;
    } else if (val.endsWith(" ")) {
      err = t.error_nombre_espacio_final;
    }
    setErroresReg((prev) => ({ ...prev, nombre: err }));
  };

  const handleCedulaChange = (val) => {
    const soloNumeros = val.replace(/[^0-9]/g, "");
    setCedula(soloNumeros);
    if (erroresReg.cedula) {
      setErroresReg((prev) => ({ ...prev, cedula: null }));
    }
  };

  const handlePhoneChange = ({ fullE164, isValid }) => {
    setTelefonoE164(fullE164);
    setIsTelefonoValid(isValid);
    if (erroresReg.telefono) {
      setErroresReg((prev) => ({ ...prev, telefono: null }));
    }
  };

  const handleCorreoChange = (val) => {
    setCorreo(val);
    let err = null;
    if (val.includes(" ")) {
      err = t.error_correo_espacios;
    }
    setErroresReg((prev) => ({ ...prev, correo: err }));
  };

  const handlePassChange = (val) => {
    setPass(val);
    let err = null;
    if (val.includes(" ")) {
      err = t.error_pass_espacios;
    }
    setErroresReg((prev) => ({ ...prev, pass: err }));
  };

  const handleConfirmPassChange = (val) => {
    setConfirmPass(val);
    let err = null;
    if (val.includes(" ")) {
      err = t.error_pass_espacios;
    } else if (pass && val !== pass) {
      err = t.error_pass_coincidencia;
    }
    setErroresReg((prev) => ({ ...prev, confirmPass: err }));
  };

  // ================= VALIDACIÓN EN TIEMPO REAL LOGIN =================
  const handleLoginCorreoChange = (val) => {
    setLoginCorreo(val);
    let err = null;
    if (val.includes(" ")) {
      err = t.error_correo_espacios;
    }
    setErroresLog((prev) => ({ ...prev, correo: err }));
  };

  const handleLoginPassChange = (val) => {
    setLoginPass(val);
    let err = null;
    if (val.includes(" ")) {
      err = t.error_pass_espacios;
    }
    setErroresLog((prev) => ({ ...prev, pass: err }));
  };

  // ================= ENVIAR REGISTRO =================
  const registrar = async (e) => {
    e.preventDefault();
    setAlertaGeneral(null);

    const nuevosErrores = {};

    // 1. Validar Nombre
    if (!nombre) {
      nuevosErrores.nombre = t.error_nombre_valido;
    } else if (nombre.startsWith(" ") && nombre.endsWith(" ")) {
      nuevosErrores.nombre = t.error_nombre_espacio_ambos;
    } else if (nombre.startsWith(" ")) {
      nuevosErrores.nombre = t.error_nombre_espacio_inicio;
    } else if (nombre.endsWith(" ")) {
      nuevosErrores.nombre = t.error_nombre_espacio_final;
    } else if (!regexNombre.test(nombre)) {
      nuevosErrores.nombre = t.error_nombre_valido;
    }

    // 2. Validar Cédula
    if (!cedula || !regexCedula.test(cedula)) {
      nuevosErrores.cedula = t.error_cedula_valida;
    }

    // 3. Validar Teléfono Internacional con libphonenumber-js
    if (telefonoE164 && !isTelefonoValid) {
      nuevosErrores.telefono = t.error_telefono_valido || "Ingresa un número de teléfono válido.";
    }

    // 4. Validar Correo
    const correoClean = correo.trim();
    if (!correoClean) {
      nuevosErrores.correo = t.error_correo_valido;
    } else if (correo.includes(" ")) {
      nuevosErrores.correo = t.error_correo_espacios;
    } else if (!regexCorreo.test(correoClean)) {
      nuevosErrores.correo = t.error_correo_valido;
    }

    // 5. Validar Contraseña
    if (!pass) {
      nuevosErrores.pass = t.error_pass_obligatoria;
    } else if (pass.includes(" ")) {
      nuevosErrores.pass = t.error_pass_espacios;
    } else if (!regexPass.test(pass)) {
      nuevosErrores.pass = t.error_pass_reglas;
    }

    // 6. Validar Confirmación de Contraseña
    if (!confirmPass) {
      nuevosErrores.confirmPass = t.error_pass_obligatoria;
    } else if (confirmPass.includes(" ")) {
      nuevosErrores.confirmPass = t.error_pass_espacios;
    } else if (pass !== confirmPass) {
      nuevosErrores.confirmPass = t.error_pass_coincidencia;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresReg(nuevosErrores);
      setAlertaGeneral({ tipo: "error", texto: t.error_campos_vacios });
      return;
    }

    setCargando(true);

    try {
      const userData = {
        nombre_usuario: nombre,
        edad: parseInt(edad, 10) || 18,
        sexo: sexo || "Femenino",
        cedula: cedula,
        telefono: telefonoE164,
        correo: correo,
        pass: pass
      };

      const res = await registroUsuario(userData);

      if (res.data && res.data.status === "OK") {
        setAlertaGeneral({ tipo: "exito", texto: t.exito_registro });

        setNombre("");
        setCedula("");
        setTelefonoE164("");
        setCorreo("");
        setPass("");
        setConfirmPass("");

        setTimeout(() => {
          setMostrarRegistro(false);
          setLoginCorreo(correo);
        }, 1200);
      } else {
        setAlertaGeneral({ tipo: "error", texto: res.data.mensaje || "Error al registrar usuario" });
      }
    } catch (error) {
      console.error(error);
      const msgError = error.response?.data?.mensaje || error.message || "Error conectando servidor";
      setAlertaGeneral({ tipo: "error", texto: msgError });
    } finally {
      setCargando(false);
    }
  };

  // ================= ENVIAR LOGIN =================
  const iniciarSesion = async (e) => {
    e.preventDefault();
    setAlertaGeneral(null);

    const nuevosErrores = {};

    if (!loginCorreo && !loginPass) {
      setAlertaGeneral({ tipo: "error", texto: t.error_campos_vacios });
      setErroresLog({ correo: t.error_correo_obligatorio, pass: t.error_pass_obligatoria });
      return;
    }

    if (!loginCorreo) {
      nuevosErrores.correo = t.error_correo_obligatorio;
    } else if (loginCorreo.includes(" ")) {
      nuevosErrores.correo = t.error_correo_espacios;
    } else if (!regexCorreo.test(loginCorreo)) {
      nuevosErrores.correo = t.error_correo_valido;
    }

    if (!loginPass) {
      nuevosErrores.pass = t.error_pass_obligatoria;
    } else if (loginPass.includes(" ")) {
      nuevosErrores.pass = t.error_pass_espacios;
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresLog(nuevosErrores);
      return;
    }

    setCargando(true);

    try {
      const res = await loginUsuario({
        correo: loginCorreo,
        pass: loginPass
      });

      if (res.data && res.data.status === "OK") {
        if (res.data.type === "admin" && res.data.token) {
          localStorage.setItem("adminToken", res.data.token);
          window.location.href = "/admin/dashboard";
        } else {
          const userObj = res.data.user;
          localStorage.setItem("userToken", res.data.token || JSON.stringify(userObj));
          localStorage.setItem("usuario", JSON.stringify(userObj));
          setUser(userObj);
          window.location.href = "/";
        }
      } else {
        setAlertaGeneral({ tipo: "error", texto: res.data.mensaje || t.error_login_credenciales });
      }
    } catch (error) {
      console.error(error);
      const msgError = error.response?.data?.mensaje || t.error_login_credenciales;
      setAlertaGeneral({ tipo: "error", texto: msgError });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="pagina-container">
      <div className="caja">
        <h1 className="titulo">
          {mostrarRegistro ? t.reg_titulo : t.log_titulo}
        </h1>

        {alertaGeneral && (
          <div className={`alerta-auth ${alertaGeneral.tipo}`}>
            {alertaGeneral.texto}
          </div>
        )}

        {/* ================= FORMULARIO LOGIN ================= */}
        {!mostrarRegistro && (
          <form className="formulario" onSubmit={iniciarSesion} noValidate>
            <div className="form-group">
              <label>{t.reg_correo} *</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={loginCorreo}
                onChange={(e) => handleLoginCorreoChange(e.target.value)}
                onKeyDown={(e) => handleKeyDownNoSpace(e, setErroresLog, 'correo', t.error_correo_espacios)}
                className={erroresLog.correo ? "input-invalid" : ""}
                required
              />
              {erroresLog.correo && <span className="field-error-text">{erroresLog.correo}</span>}
            </div>

            <div className="form-group">
              <label>{t.reg_pass} *</label>
              <div className="password-field-wrapper">
                <input
                  type={showLoginPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => handleLoginPassChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDownNoSpace(e, setErroresLog, 'pass', t.error_pass_espacios)}
                  className={erroresLog.pass ? "input-invalid" : ""}
                  required
                />
                <button
                  type="button"
                  className="btn-eye-toggle"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  title={showLoginPass ? t.ocultar_pass : t.mostrar_pass}
                >
                  {showLoginPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {erroresLog.pass && <span className="field-error-text">{erroresLog.pass}</span>}
            </div>

            <button type="submit" className="btn-principal" disabled={cargando}>
              {cargando ? t.log_btn_cargando : t.log_btn}
            </button>
          </form>
        )}

        {/* ================= FORMULARIO REGISTRO ================= */}
        {mostrarRegistro && (
          <form className="formulario" onSubmit={registrar} noValidate>
            <div className="form-group">
              <label>{t.reg_nombre} *</label>
              <input
                type="text"
                placeholder="Ej: María Fernanda López"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                className={erroresReg.nombre ? "input-invalid" : ""}
                required
              />
              {erroresReg.nombre && <span className="field-error-text">{erroresReg.nombre}</span>}
            </div>

            <div className="form-group">
              <label>{t.reg_cedula} *</label>
              <input
                type="text"
                placeholder="Ej: 1017123456"
                value={cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                className={erroresReg.cedula ? "input-invalid" : ""}
                required
              />
              {erroresReg.cedula && <span className="field-error-text">{erroresReg.cedula}</span>}
            </div>

            <div className="form-group">
              <label>{t.reg_telefono}</label>
              <PhoneInput
                value={telefonoE164}
                onChange={handlePhoneChange}
                placeholder="Ej: 3018640872"
                defaultCountry="CO"
                errorText={erroresReg.telefono}
              />
            </div>

            <div className="form-group">
              <label>{t.reg_correo} *</label>
              <input
                type="email"
                placeholder="usuario@correo.com"
                value={correo}
                onChange={(e) => handleCorreoChange(e.target.value)}
                onKeyDown={(e) => handleKeyDownNoSpace(e, setErroresReg, 'correo', t.error_correo_espacios)}
                className={erroresReg.correo ? "input-invalid" : ""}
                required
              />
              {erroresReg.correo && <span className="field-error-text">{erroresReg.correo}</span>}
            </div>

            <div className="form-group">
              <label>{t.reg_pass} *</label>
              <div className="password-field-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => handlePassChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDownNoSpace(e, setErroresReg, 'pass', t.error_pass_espacios)}
                  className={erroresReg.pass ? "input-invalid" : ""}
                  required
                />
                <button
                  type="button"
                  className="btn-eye-toggle"
                  onClick={() => setShowPass(!showPass)}
                  title={showPass ? t.ocultar_pass : t.mostrar_pass}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {erroresReg.pass && <span className="field-error-text">{erroresReg.pass}</span>}
            </div>

            <div className="form-group">
              <label>{t.reg_confirm_pass} *</label>
              <div className="password-field-wrapper">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPass}
                  onChange={(e) => handleConfirmPassChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDownNoSpace(e, setErroresReg, 'confirmPass', t.error_pass_espacios)}
                  className={erroresReg.confirmPass ? "input-invalid" : ""}
                  required
                />
                <button
                  type="button"
                  className="btn-eye-toggle"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  title={showConfirmPass ? t.ocultar_pass : t.mostrar_pass}
                >
                  {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {erroresReg.confirmPass && <span className="field-error-text">{erroresReg.confirmPass}</span>}
            </div>

            <button type="submit" className="btn-principal" disabled={cargando}>
              {cargando ? t.reg_btn_cargando : t.reg_btn}
            </button>
          </form>
        )}

        {/* ================= CAMBIAR ENTRE LOGIN Y REGISTRO ================= */}
        <button type="button" className="btn-secundario" onClick={toggleVista}>
          {mostrarRegistro ? t.ya_tengo_cuenta : t.crear_cuenta}
        </button>
      </div>
    </div>
  );
}

export default InicioSeccion;