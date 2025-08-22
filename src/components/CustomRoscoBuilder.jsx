import { useRef, useState } from "react";
import { useGameSettings } from "../../lib/useGameSettings";
import { saveCustomWords } from "../../lib/sheets";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const makeDefaultRows = () =>
  ALPHABET.map(L => ({ letter: L, answer: "", clue: "", rule: "starts_with" }));

export default function CustomRoscoBuilder({ open, rows, setRows, onClose, onDone }) {
  const { playerName, setMode } = useGameSettings();

  // ⚙️ SIEMPRE declaramos hooks, aunque open sea false
  const [fallbackRows, setFallbackRows] = useState(makeDefaultRows);
  const list   = Array.isArray(rows) ? rows : fallbackRows;               // lista segura
  const setList = typeof setRows === "function" ? setRows : setFallbackRows;

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [invalids, setInvalids] = useState(new Set());
  const rowRefs = useRef(ALPHABET.map(() => null));

  // ❌ no useMemo: no es necesario y evita cambiar conteo de hooks
  const completed = list.filter(r => r?.answer?.trim() && r?.clue?.trim()).length;

  const updateRow = (idx, patch) => {
    setList(prev => {
      const base = Array.isArray(prev) && prev.length ? prev : makeDefaultRows();
      const next = [...base];
      next[idx] = { ...base[idx], ...patch, letter: ALPHABET[idx], rule: "starts_with" };
      return next;
    });
  };

  const handleListo = async () => {
    setErr("");
    // validar vacíos
    const bad = [];
    list.forEach((r, i) => {
      if (!r?.answer?.trim() || !r?.clue?.trim()) bad.push(i);
    });
    if (bad.length) {
      setInvalids(new Set(bad));
      setErr(`Completá todas las respuestas y pistas. Faltan ${bad.length} letras.`);
      rowRefs.current[bad[0]]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalids(new Set());

    const words = list.map(r => ({
      letter: r.letter,
      answer: r.answer.trim(),
      clue: r.clue.trim(),
      rule: "starts_with",
    }));

    try {
      setSaving(true);
      localStorage.setItem("rosco_custom", JSON.stringify(words));
      await saveCustomWords({ author: playerName || "Anónimo", words });
      setMode("custom");
      onDone?.(words);
      onClose?.();
    } catch (e) {
      console.error(e);
      setErr("No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Render condicional DESPUÉS de los hooks, así no cambia el orden
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Rosco Personalizado</h2>
        <p>Completá palabras y pista por letra. Completadas: {completed}/27</p>

        <div className="rosco-list">
          {ALPHABET.map((L, i) => (
            <div key={L} ref={el => (rowRefs.current[i] = el)} className="rosco-row">
              <span className="badge">{L}</span>

              <input
                className={`input ${invalids.has(i) && !list[i]?.answer?.trim() ? "error" : ""}`}
                placeholder="respuesta"
                value={list[i]?.answer || ""}
                onChange={(e) => updateRow(i, { answer: e.target.value })}
              />

              <input
                className={`input ${invalids.has(i) && !list[i]?.clue?.trim() ? "error" : ""}`}
                placeholder="pista / definición"
                value={list[i]?.clue || ""}
                onChange={(e) => updateRow(i, { clue: e.target.value })}
              />
            </div>
          ))}
        </div>

        {err && <div className="error-box">{err}</div>}

        <div className="actions">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button
            className="btn"
            type="button"
            onClick={() => localStorage.setItem("rosco_custom", JSON.stringify(list))}
          >
            Guardar local
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={handleListo}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Listo"}
          </button>
        </div>
      </div>
    </div>
  );
}
