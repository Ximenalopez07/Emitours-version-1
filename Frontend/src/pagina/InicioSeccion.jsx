import { useState } from "react";
import "./inicioseccion.css";
import { loginUsuario, registroUsuario } from "../api";

function InicioSeccion() {

  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  // ================= DATOS GUARDADOS =================

  const [usuarioGuardado, setUsuarioGuardado] = useState("");
  const [passGuardada, setPassGuardada] = useState("");

  // ================= REGISTRO =================

  const [usuario, setUsuario] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");

  // ================= LOGIN =================

  const [loginCorreo, setLoginCorreo] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ================= VALIDACIONES =================

  const validarSinEspacios = (v) => v.replace(/\s+/g, "");

  const validarNombreUsuario = (v) =>
    validarSinEspacios(v.replace(/[^a-zA-Z0-9]/g, ""));

  const validarEdad = (v) =>
    v.replace(/[^0-9]/g, "");

  const validarCedula = (v) => {
    let limpio = v.replace(/[^0-9]/g, "");

    if (limpio.length > 10) {
      limpio = limpio.slice(0, 10);
    }

    return limpio;
  };

  const validarCorreo = (v) =>
    v.replace(/\s+/g, "");

  const validarPass = (v) =>
    v.replace(/\s+/g, "");

  // ================= VALIDAR CONTRASEÑA =================

  const esPassValida = (p) =>
    /[A-Z]/i.test(p) &&
    /[0-9]/.test(p) &&
    /[^a-zA-Z0-9]/.test(p) &&
    p.length >= 6;

  // ================= REGISTRAR =================

  const registrar = async (e) => {

    e.preventDefault();

    if (!esPassValida(pass)) {
      alert("❌ Contraseña débil");
      return;
    }

    try {
      const userData = {
        nombre_usuario: usuario,
        edad: parseInt(edad),
        sexo,
        cedula,
        correo,
        pass
      };

      await registroUsuario(userData);

      alert("✅ Usuario registrado correctamente");

      // LIMPIAR
      setUsuario("");
      setEdad("");
      setSexo("");
      setCedula("");
      setCorreo("");
      setPass("");

      // VOLVER LOGIN
      setMostrarRegistro(false);
    } catch (error) {
      console.error(error);
      alert("❌ Error al registrar usuario: " + (error.response?.data?.mensaje || error.message));
    }
  };

  // ================= LOGIN CON BACKEND =================

  const iniciarSesion = async (e) => {

    e.preventDefault();

    try {
      const res = await loginUsuario({
        correo: loginCorreo,
        pass: loginPass
      });

      if (res.data.status === "OK") {
        localStorage.setItem("usuario", JSON.stringify(res.data.user));
        alert("✅ Bienvenido " + res.data.user.nombre_usuario + "!");
      } else {
        alert("❌ " + res.data.mensaje);
      }

    } catch (error) {
      console.error(error);
      alert("❌ Error conectando servidor");
    }

  };

  return (

    <div className="pagina-container">

      <div className="caja">

        <h1 className="titulo">

          {mostrarRegistro
            ? "Crear Cuenta"
            : "Iniciar Sesión"}

        </h1>

        {/* ================= LOGIN ================= */}

        {!mostrarRegistro && (

          <form
            className="formulario"
            onSubmit={iniciarSesion}
          >

            <input
              type="email"
              placeholder="Correo"
              value={loginCorreo}
              onChange={(e) =>
                setLoginCorreo(
                  validarCorreo(e.target.value)
                )
              }
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={loginPass}
              onChange={(e) =>
                setLoginPass(
                  validarPass(e.target.value)
                )
              }
              required
            />

            <button className="btn-principal">
              Entrar
            </button>

          </form>
        )}

        {/* ================= REGISTRO ================= */}

        {mostrarRegistro && (

          <form
            className="formulario"
            onSubmit={registrar}
          >

            <input
              placeholder="Usuario"
              value={usuario}
              onChange={(e) =>
                setUsuario(
                  validarNombreUsuario(e.target.value)
                )
              }
              required
            />

            <input
              placeholder="Edad"
              value={edad}
              onChange={(e) =>
                setEdad(
                  validarEdad(e.target.value)
                )
              }
              required
            />

            <select
              value={sexo}
              onChange={(e) =>
                setSexo(e.target.value)
              }
              required
            >

              <option value="">
                Sexo
              </option>

              <option>
                Femenino
              </option>

              <option>
                Masculino
              </option>

              <option>
                Otro
              </option>

            </select>

            <input
              placeholder="Cédula"
              value={cedula}
              onChange={(e) =>
                setCedula(
                  validarCedula(e.target.value)
                )
              }
              required
            />

            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) =>
                setCorreo(
                  validarCorreo(e.target.value)
                )
              }
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) =>
                setPass(
                  validarPass(e.target.value)
                )
              }
              required
            />

            <button className="btn-principal">
              Registrarme
            </button>

          </form>
        )}

        {/* ================= CAMBIAR FORMULARIO ================= */}

        <button
          className="btn-secundario"
          onClick={() =>
            setMostrarRegistro(!mostrarRegistro)
          }
        >

          {mostrarRegistro
            ? "Ya tengo cuenta"
            : "Crear cuenta"}

        </button>

      </div>

    </div>
  );
}

export default InicioSeccion;