import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { listCustomAuthors, getCustomWordsByAuthor, saveCustomWords } from "../../lib/sheets";
import "/src/styles/editor.css";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

function emptyRows() {
  return ALPHABET.map((L) => ({
    letter: L,
    clue: "",
    answer: "",
    rule: "starts_with",
  }));
}

export default function Editor() {
  const navigate = useNavigate();
  const location = useLocation();

  // Autor preferido: state -> query -> localStorage
  const preloadFromState = (location?.state?.author || "").trim();
  const preloadFromQuery = (new URLSearchParams(location.search).get("author") || "").trim();
  const preloadFromLS    = (typeof window !== "undefined" && localStorage.getItem("lastEditedAuthor")) || "";
  const preload = (preloadFromState || preloadFromQuery || preloadFromLS).trim();

  const [authors, setAuthors] = useState([]);
  const [author, setAuthor]   = useState(preload);
  const [rows, setRows]       = useState(emptyRows);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ type: "", text: "" });

  // Cargar autores al entrar y fijar autor inicial válido
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await listCustomAuthors();
      setLoading(false);
      if (!mounted) return;
      if (!res?.ok) {
        setAuthors([]);
        return setMsg({ type: "error", text: res?.error || "No se pudieron listar autores." });
      }
      const list = res.authors || [];
      setAuthors(list);

      if (list.length) {
        if (preload && list.includes(preload)) {
          setAuthor(preload);
        } else if (!author) {
          setAuthor(list[0]);
        }
      } else {
        setAuthor("");
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistir selección del autor
  useEffect(() => {
    if (author) localStorage.setItem("lastEditedAuthor", author);
  }, [author]);

  // Cargar palabras del autor
  useEffect(() => {
    if (!author) return;
    let mounted = true;
    (async () => {
      setMsg({ type: "", text: "" });
      setLoading(true);
      const res = await getCustomWordsByAuthor(author);
      setLoading(false);
      if (!mounted) return;
      if (!res?.ok) {
        setRows(emptyRows());
        return setMsg({ type: "error", text: res?.error || "No se pudieron cargar las palabras." });
      }
      const byLetter = new Map((res.words || []).map(w => [w.letter, w]));
      const next = ALPHABET.map(L => {
        const w = byLetter.get(L);
        return {
          letter: L,
          clue:   w?.clue   ?? "",
          answer: w?.answer ?? "",
          rule:   w?.rule   ?? "starts_with",
        };
      });
      setRows(next);
    })();
    return () => { mounted = false; };
  }, [author]);

  const setField = (idx, field, value) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setMsg({ type: "", text: "" });
    // Validación: pista y respuesta deben venir en pares
    const problems = rows.filter(r => (r.clue && !r.answer) || (!r.clue && r.answer));
    if (problems.length) {
      return setMsg({ type: "error", text: "Completá pista y respuesta en las letras donde cargues datos." });
    }

    setSaving(true);
    const payload = rows
      .filter(r => r.clue && r.answer)
      .map(r => ({
        letter: r.letter,
        clue: r.clue.trim(),
        answer: r.answer.trim().toLowerCase(),
        rule: r.rule || "starts_with",
      }));

    const res = await saveCustomWords({ author, words: payload });
    setSaving(false);

    if (!res?.ok) {
      return setMsg({ type: "error", text: res?.error || "No se pudo guardar. Intentá de nuevo." });
    }
    setMsg({ type: "ok", text: "¡Guardado! Tus palabras quedaron actualizadas." });
  };

  const handleDone = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="container editor">
      {/* Header */}
      
        <div className="editor-title">
          <span style={{ fontSize: 25 }}>📝</span>
          <h2>Editor de Palabras</h2>
        </div>

      

      {/* Controles */}
      <div className="editor-controls">
        <label className="editor-label">Autor:</label>
        <select
          className="editor-select"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          disabled={loading || saving}
        >
          {!authors.length && <option value="">(no hay autores)</option>}
          {authors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

{/*         <button className="btn ghost" onClick={() => setRows(emptyRows())} disabled={saving || loading}>
          Limpiar todo
        </button> */}
      </div>

      {/* Mensaje */}
      {msg.text && (
        <div className={`editor-msg ${msg.type === "error" ? "error" : "ok"}`}>
          {msg.text}
        </div>
      )}

      {/* Grilla */}
      <div className="editor-grid">
        <div className="editor-grid-head">
          <div>Letra</div>
          <div>Pista</div>
          <div>Respuesta</div>
          <div>Regla</div>
        </div>

        <div className="editor-rows">
          {rows.map((r, i) => (
            <div className="editor-row" key={r.letter}>
              <div className="editor-letter">{r.letter}</div>

              <input
                className="editor-input"
                type="text"
                placeholder="Pista..."
                value={r.clue}
                onChange={e => setField(i, "clue", e.target.value)}
                disabled={loading || saving}
              />

              <input
                className="editor-input"
                type="text"
                placeholder="Respuesta..."
                value={r.answer}
                onChange={e => setField(i, "answer", e.target.value)}
                disabled={loading || saving}
              />

              <select
                className="editor-select-small"
                value={r.rule}
                onChange={e => setField(i, "rule", e.target.value)}
                disabled={loading || saving}
              >
                <option value="starts_with">Empieza con la letra</option>
                <option value="contains">Contiene la letra</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Actions footer */}
      <div className="editor-actions" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button className="btn outline" onClick={handleDone}>Listo</button>
        <button className="btn primary" onClick={handleSave} disabled={saving || loading || !author}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
