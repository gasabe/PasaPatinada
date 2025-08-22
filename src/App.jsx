import { Outlet, Link } from "react-router-dom";

export default function App() {
  return (
    <div className="container">
      <header
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 16 }}
      >
        <Link to="/" style={{ fontWeight: 800 }}>
          🎯 PasaPatinada
        </Link>
        <nav className="row" style={{ gap: 8 }}>
          <Link className="btn btn-ghost" to="/">Inicio</Link>
          <Link className="btn btn-ghost" to="/game">Jugar</Link>
          <Link className="btn btn-ghost" to="/ranking">Ranking</Link> {/* 🆕 */}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
