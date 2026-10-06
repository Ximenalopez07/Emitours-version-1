import React, { useContext, useState } from "react";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { updateUsuario, deleteUsuario } from "../api";
import PhoneInput from "../components/PhoneInput";
import "./ProfileDrawer.css";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, setUser, theme, toggleTheme, language, setLanguage } = useContext(UIContext);
  const t = translations[language] || translations.es;

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre_usuario || "");
  const [telefonoE164, setTelefonoE164] = useState(user?.telefono || "");
  const [isTelefonoValid, setIsTelefonoValid] = useState(true);
  const [foto, setFoto] = useState(user?.picture || user?.foto || "");
  const [errorProfile, setErrorProfile] = useState(null);

  if (!isOpen) return null;

  const handlePhoneChange = ({ fullE164, isValid }) => {
    setTelefonoE164(fullE164);
    setIsTelefonoValid(isValid);
    setErrorProfile(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorProfile(null);

    if (telefonoE164 && !isTelefonoValid) {
      setErrorProfile(t.error_telefono_valido || "Ingresa un número de teléfono válido.");
      return;
    }

    try {
      const res = await updateUsuario(user.id_registro, {
        nombre_usuario: nombre,
        telefono: telefonoE164,
        foto
      });

      if (res.data && res.data.user) {
        setUser(res.data.user);
        alert(t.exito_perfil);
      } else {
        alert(t.exito_perfil);
        setUser({ ...user, nombre_usuario: nombre, telefono: telefonoE164, foto });
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setErrorProfile(err.response?.data?.mensaje || err.message);
    }
  };

  const handleCancelProfile = () => {
    setNombre(user?.nombre_usuario || "");
    setTelefonoE164(user?.telefono || "");
    setFoto(user?.picture || user?.foto || "");
    setErrorProfile(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("userToken");
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    sessionStorage.clear();
    setUser(null);
    onClose();
    window.location.href = "/inicioseccion";
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(t.confirmar_eliminar);
    if (!confirmDelete) return;

    try {
      await deleteUsuario(user.id_registro);
      alert(t.exito_eliminar);
      setUser(null);
      onClose();
    } catch (err) {
      console.error(err);
      alert(t.error_eliminar + (err.response?.data?.mensaje || err.message));
    }
  };

  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
  const userAvatar = (user?.picture && typeof user.picture === "string" && user.picture.trim())
    || (user?.foto && typeof user.foto === "string" && user.foto.trim())
    || defaultAvatar;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className={`profile-drawer ${theme}`}>
        <div className="drawer-header">
          <h2>👤 {t.mi_perfil}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="drawer-content">
          {/* SECCIÓN 1: PERFIL */}
          <div className="drawer-section">
            <div className="avatar-container">
              <img 
                src={userAvatar} 
                alt="Avatar" 
                className="user-avatar"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>

            {!isEditing ? (
              <div className="profile-info">
                <h3>{user?.nombre_usuario}</h3>
                <p><strong>{t.correo}:</strong> {user?.correo_electronico}</p>
                <p><strong>{t.telefono}:</strong> {user?.telefono || <em>{t.no_definido}</em>}</p>
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  ✏️ {t.editar_info}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="profile-form">
                {errorProfile && (
                  <div className="alerta-auth error" style={{ marginBottom: "12px" }}>
                    {errorProfile}
                  </div>
                )}
                <div className="form-group">
                  <label>{t.nombre}</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t.telefono}</label>
                  <PhoneInput
                    value={telefonoE164}
                    onChange={handlePhoneChange}
                    placeholder="Ej: 3018640872"
                    defaultCountry="CO"
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn-save">{t.guardar}</button>
                  <button type="button" className="btn-cancel" onClick={handleCancelProfile}>
                    {t.cancelar}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* SECCIÓN 2: SEGURIDAD (Sin cambiar contraseña ni dispositivos en UI) */}
          <div className="drawer-section">
            <h3>🔒 {t.seguridad}</h3>
            
            <button className="btn-logout" onClick={handleLogout}>
              🚪 {t.cerrar_sesion}
            </button>
            <button className="btn-delete-account" onClick={handleDeleteAccount}>
              {t.eliminar_cuenta}
            </button>
          </div>

          {/* SECCIÓN 3: CONFIGURACIÓN */}
          <div className="drawer-section">
            <h3>⚙️ {t.configuracion}</h3>

            <div className="config-row">
              <span>🌓 {t.tema}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="config-row">
              <span>🌐 {t.idioma}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="es">{t.idioma_es}</option>
                <option value="en">{t.idioma_en}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
