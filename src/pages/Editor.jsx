import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { listCustomAuthors, getCustomWordsByAuthor, saveCustomWords } from "../../lib/sheets";
import "../styles/editor.css";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const NEW_OPT = "__new__";

function emptyRows() {
  return ALPHABET.map((L) => ({
    letter: L,
    clue: "",
    answer: "",
    rule: "starts_with",
  }));
}

// normalizamos nombre de autor para evitar espacios raros
function normalizeAuthorName(s = "") {
  return s
    .trim()
    .replace(/\s+/g, "_")       // espacios a guión bajo
    .replace(/[^a-zA-Z0-9_.-]/g, "") // sólo caracteres seguros
    .slice(0, 40);              // límite razonable
}

export default function Editor() {
  const navigate = useNavigate();
  const location = useLocation();

  // Autor preferido: state -> query -> localStorage
  const preloadFromState = (location?.state?.author || "").trim();
  const preloadFromQuery = (new URLSearchParams(location.search).get("author") || "").trim();
  const preloadFromLS =
    (typeof window !== "undefined" && localStorage.getItem("lastEditedAuthor")) || "";
  const preload = (preloadFromState || preloadFromQuery || preloadFromLS).trim();

  const [authors, setAuthors] = useState([]);
  const [author, setAuthor] = useState(preload);
  const [rows, setRows] = useState(emptyRows);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // UI para alta de autor
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

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
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (author) localStorage.setItem("lastEditedAuthor", author);
  }, [author]);

  // Cargar palabras del autor seleccionado
  useEffect(() => {
    if (!author || creating) return; // si estoy creando uno nuevo, no cargo nada
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
      const byLetter = new Map((res.words || []).map((w) => [w.letter, w]));
      const next = ALPHABET.map((L) => {
        const w = byLetter.get(L);
        return {
          letter: L,
          clue: w?.clue ?? "",
          answer: w?.answer ?? "",
          rule: w?.rule ?? "starts_with",
        };
      });
      setRows(next);
    })();
    return () => {
      mounted = false;
    };
  }, [author, creating]);

  const setField = (idx, field, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Crear autor (solo lado UI; el alta real se materializa al guardar con saveCustomWords)
  const handleStartCreate = () => {
    setCreating(true);
    setNewName("");
    setRows(emptyRows());
    setMsg({ type: "", text: "" });
  };

  const handleConfirmCreate = () => {
    const norm = normalizeAuthorName(newName);
    if (!norm) {
      return setMsg({ type: "error", text: "Indicá un nombre de autor válido." });
    }
    if (authors.includes(norm)) {
      // Si ya existe, simplemente lo seleccionamos
      setCreating(false);
      setAuthor(norm);
      setMsg({ type: "ok", text: `Usando autor existente: ${norm}` });
      return;
    }
    // UI: establecemos el nuevo autor y lo agregamos a la lista local
    setAuthors((prev) => [...prev, norm]);
    setAuthor(norm);
    setCreating(false);
    setMsg({ type: "ok", text: `Autor creado: ${norm}. Cargá tus palabras y guardá.` });
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setNewName("");
    setMsg({ type: "", text: "" });
    // si no había autor, dejemos vacío; si había, mantenemos
  };

  const handleSave = async () => {
    setMsg({ type: "", text: "" });

    if (!author) {
      return setMsg({ type: "error", text: "Elegí (o creá) un autor antes de guardar." });
    }

    // Validación: pista y respuesta en pares
    const problems = rows.filter((r) => (r.clue && !r.answer) || (!r.clue && r.answer));
    if (problems.length) {
      return setMsg({
        type: "error",
        text: "Completá pista y respuesta en las letras donde cargues datos.",
      });
    }

    setSaving(true);
    const payload = rows
      .filter((r) => r.clue && r.answer)
      .map((r) => ({
        letter: r.letter,
        clue: r.clue.trim(),
        answer: r.answer.trim().toLowerCase(),
        rule: r.rule || "starts_with",
      }));

    // IMPORTANTE: muchos backends crean el autor automáticamente si no existe
    // (si el tuyo no lo hace, luego podemos agregar una función createAuthor)
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

        {!creating ? (
          <>
            <select
              className="editor-select"
              value={author || ""}
              onChange={(e) => {
                if (e.target.value === NEW_OPT) {
                  handleStartCreate();
                } else {
                  setAuthor(e.target.value);
                }
              }}
              disabled={loading || saving}
            >
              {!authors.length && <option value="">(no hay autores)</option>}
              {authors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value={NEW_OPT}>➕ Nuevo autor…</option>
            </select>
          </>
        ) : (
          <div className="editor-new-author">
            <input
              className="editor-input"
              placeholder="Nombre del nuevo autor (ej. juan_test)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmCreate();
                if (e.key === "Escape") handleCancelCreate();
              }}
              autoFocus
              disabled={saving || loading}
            />
            <button className="btn primary" onClick={handleConfirmCreate} disabled={saving || loading}>
              Crear
            </button>
            <button className="btn ghost" onClick={handleCancelCreate} disabled={saving || loading}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Mensaje */}
      {msg.text && <div className={`editor-msg ${msg.type === "error" ? "error" : "ok"}`}>{msg.text}</div>}

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
                onChange={(e) => setField(i, "clue", e.target.value)}
                disabled={loading || saving}
              />

              <input
                className="editor-input"
                type="text"
                placeholder="Respuesta..."
                value={r.answer}
                onChange={(e) => setField(i, "answer", e.target.value)}
                disabled={loading || saving}
              />

              <select
                className="editor-select-small"
                value={r.rule}
                onChange={(e) => setField(i, "rule", e.target.value)}
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
        <button className="btn outline" onClick={handleDone}>
          Listo
        </button>
        <button className="btn primary" onClick={handleSave} disabled={saving || loading || !author}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
