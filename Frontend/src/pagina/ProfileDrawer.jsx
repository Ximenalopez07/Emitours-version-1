import React, { useContext, useState } from "react";
import { UIContext } from "../context/UIContext";
import { translations } from "../utils/translations";
import { updateUsuario, cambiarContrasena, deleteUsuario } from "../api";
import "./ProfileDrawer.css";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, setUser, theme, toggleTheme, language, setLanguage } = useContext(UIContext);
  const t = translations[language];

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre_usuario || "");
  const [correo, setCorreo] = useState(user?.correo_electronico || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [foto, setFoto] = useState(user?.foto || "");

  // Password Change State
  const [showPassForm, setShowPassForm] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  // Devices State
  const [showDevices, setShowDevices] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateUsuario(user.id_registro, {
        nombre_usuario: nombre,
        correo_electronico: correo,
        telefono,
        foto,
        edad: user.edad,
        sexo: user.sexo
      });

      if (res.data && res.data.user) {
        setUser(res.data.user);
        alert(t.exito_perfil);
      } else {
        alert(t.exito_perfil);
        setUser({ ...user, nombre_usuario: nombre, correo_electronico: correo, telefono, foto });
      }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert(t.error_perfil + (err.response?.data?.mensaje || err.message));
    }
  };

  const handleCancelProfile = () => {
    setNombre(user?.nombre_usuario || "");
    setCorreo(user?.correo_electronico || "");
    setTelefono(user?.telefono || "");
    setFoto(user?.foto || "");
    setIsEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmarContrasena) {
      alert(t.error_pass_diferentes);
      return;
    }
    if (nuevaContrasena.length < 6) {
      alert(t.error_pass_corta);
      return;
    }

    try {
      await cambiarContrasena(user.id_registro, {
        contrasenaActual,
        nuevaContrasena
      });
      alert(t.exito_pass);
      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");
      setShowPassForm(false);
    } catch (err) {
      console.error(err);
      alert(t.error_pass + (err.response?.data?.mensaje || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
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

  const defaultAvatar = "https://www.w3schools.com/howto/img_avatar.png";
  const userAvatar = user?.foto || defaultAvatar;

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
              <img src={userAvatar} alt="Avatar" className="user-avatar" />
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
                  <label>{t.correo}</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t.telefono}</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Eje: +57 3001234567"
                  />
                </div>
                <div className="form-group">
                  <label>{t.foto}</label>
                  <input
                    type="text"
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    placeholder="https://enlace-a-tu-foto.jpg"
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

          {/* SECCIÓN 2: SEGURIDAD */}
          <div className="drawer-section">
            <h3>🔒 {t.seguridad}</h3>
            
            <button className="drawer-link-btn" onClick={() => setShowPassForm(!showPassForm)}>
              🔑 {t.cambiar_pass}
            </button>

            {showPassForm && (
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <input
                    type="password"
                    placeholder={t.pass_actual}
                    value={contrasenaActual}
                    onChange={(e) => setContrasenaActual(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder={t.pass_nueva}
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder={t.pass_confirmar}
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-update-pass">{t.actualizar_pass}</button>
              </form>
            )}

            <button className="drawer-link-btn" onClick={() => setShowDevices(!showDevices)}>
              📱 {t.dispositivos}
            </button>

            {showDevices && (
              <div className="devices-list">
                <h4>{t.dispositivos_activos}:</h4>
                <div className="device-item">
                  <span className="device-icon">💻</span>
                  <div>
                    <p className="device-name">{t.este_dispositivo}</p>
                    <p className="device-meta">Chrome - {t.medellin}</p>
                  </div>
                </div>
                <div className="device-item mockup">
                  <span className="device-icon">📱</span>
                  <div>
                    <p className="device-name">iPhone 15 - {t.medellin}</p>
                    <p className="device-meta">Safari - 2 hrs ago</p>
                  </div>
                </div>
              </div>
            )}

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
