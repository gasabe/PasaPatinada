import { useEffect, useMemo, useState } from "react";
import { useGameSettings } from "../../lib/useGameSettings"; 
import { ALPHABET } from "../../lib/constants";
import { saveCustomWords } from "../../lib/sheets";

export default function CustomRoscoBuilder({ open, onClose }) {
  const { customWords, setCustomWords, playerName } = useGameSettings();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const map = new Map((customWords || []).map(r => [r.letter, r]));
    const initial = ALPHABET.map(letter => ({
      letter,
      answer: map.get(letter)?.answer || "",
      clue: map.get(letter)?.clue || "",
    }));
    setRows(initial);
  }, [customWords]);

  const filled = useMemo(() => rows.filter(r => r.answer.trim()).length, [rows]);

  if (!open) return null;

  const update = (idx, key, value) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const handleSaveLocal = () => {
    setCustomWords(rows.filter(r => r.answer.trim()));
    setMsg("Guardado local ✔ (listo para jugar en modo personalizado)");
  };

  const handleSaveSheet = async () => {
    try {
      setSaving(true);
      await saveCustomWords({
        author: playerName || "anon",
        words: rows.filter(r => r.answer.trim()),
      });
      setMsg("Guardado en Sheet ✔");
    } catch (e) {
      setMsg("Error guardando en Sheet: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content large" role="dialog" aria-modal="true">
        <h2>Rosco Personalizado</h2>
        <p>Completá palabras y pista por letra. Completadas: {filled}/{ALPHABET.length}</p>

        <div className="grid-rosco">
          {rows.map((r, idx) => (
            <div key={r.letter} className="row-rosco">
              <div className="cell-letter">{r.letter}</div>
              <input
                className="cell-answer"
                placeholder="respuesta"
                value={r.answer}
                onChange={(e) => update(idx, "answer", e.target.value)}
              />
              <input
                className="cell-clue"
                placeholder="pista / definición"
                value={r.clue}
                onChange={(e) => update(idx, "clue", e.target.value)}
              />
            </div>
          ))}
        </div>

        {msg && <p className="hint">{msg}</p>}

        <div className="actions">
          <button className="btn" onClick={handleSaveLocal}>Guardar local</button>
          <button className="btn" disabled={saving} onClick={handleSaveSheet}>
            {saving ? "Guardando..." : "Guardar en Sheet"}
          </button>
          <button className="btn primary" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
}
