import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>🎯 ¡Bienvenido a PasaPatinada!</h1>
      <p>Responde una palabra por cada letra del rosco. Tenés tiempo limitado.</p>
      <Link
        to="/game"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          padding: "12px 20px",
          borderRadius: "8px",
          background: "#3fc4b2",
          color: "#112",
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        Entrar al juego
      </Link>
    </div>
  );
}
