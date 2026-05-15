import "./Barra.css";
import facebook from "../assets/facebook.jpg";
import instagram from "../assets/instagram.jpg";
import pse from "../assets/pse.jpg";

function Barra() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <img src={facebook} alt="Facebook" className="social-icon" />
        <img src={instagram} alt="Instagram" className="social-icon" />
      </div>

      <div className="footer-center">
        <p className="email"> emitoursc13@gmail.com</p>
        <p className="politicas">Para la empresa la seguridad del titular es nuestra prioridad,
        por lo que protegemos sus datos personales mediante el uso, 
        aplicación y mantenimiento de altas medidas de seguridad 
        técnicas, físicas y administrativas, teniendo el titular la certeza 
        que sus datos personales estarán protegidos y serán tratados 
        de manera confidencial. Les informamos que el RESPONSABLE de recabar y 
        dar tratamiento y/o utilizar los datos personales que el titular proporcione es la 
        empresa, así como sus subsidiarias, asociadas, sociedades controladoras y afiliadas.</p>
      </div>

      <div className="footer-right">
        <img src={pse} alt="PSE" className="pse-logo" />
      </div>
    </footer>
  );
}

export default Barra;