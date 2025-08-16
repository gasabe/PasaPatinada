import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>🎯 ¡Bienvenido a PasaPatinada!</h1>
      <p>
        Responde una palabra por cada letra del rosco. Tenés tiempo limitado.
      </p>
      <Link className="enter-game" to="/game">Entrar al juego</Link>
    </div>
  );
}
