
import { useEffect, useState } from "react";
import { getRanking } from "../../lib/sheets"; // ajustá la ruta si tu archivo está en otro lado

export default function Ranking() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState(""); // "" = todos
  const [top, setTop] = useState(20);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      const res = await getRanking({
        mode: mode || null,
        top: Number(top) || 20,
        perPlayerBest: true,
      });
      if (cancel) return;
      if (!res?.ok) {
        setErr(res?.error || "Error leyendo ranking");
        setRows([]);
      } else {
        // normalizar fechas a string legible
        const data = (res.data || []).map((r, i) => ({
          ...r,
          pos: i + 1,
          dateStr: r.date ? new Date(r.date).toLocaleString() : "-",
        }));
        setRows(data);
      }
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [mode, top]);

  return (
    <div className="ranking-page">
      <h1 style={{ marginBottom: 12 }}>🏆 Ranking</h1>

      <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <label className="row" style={{ gap: 6 }}>
          Modo:
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="">Todos</option>
            {/* agrega más modos si usás otros */}
          </select>
        </label>

        <label className="row" style={{ gap: 6 }}>
          Top:
          <input
            type="number"
            min={1}
            max={100}
            value={top}
            onChange={e => setTop(e.target.value)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      {loading && <p>Cargando ranking…</p>}
      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Puntaje</th>
                <th>Modo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", opacity: 0.7 }}>
                    No hay registros aún.
                  </td>
                </tr>
              )}
              {rows.map(r => (
                <tr key={`${r.player}-${r.date}-${r.score}`}>
                  <td>{r.pos}</td>
                  <td>{r.player}</td>
                  <td><strong>{r.score}</strong></td>
                  <td>{r.mode || "-"}</td>
                  <td>{r.dateStr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
