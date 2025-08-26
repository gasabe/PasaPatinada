import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSettings } from "../../lib/useGameSettings";
import { listCustomAuthors, getCustomWordsByAuthor } from "../../lib/sheets";

export default function GameStartModal({ open, onStart, onOpenCustomBuilder }) {
  const { mode, setMode, rule, setRule, playerName, setPlayerName, setCustomWords } = useGameSettings();
  const [error, setError] = useState("");
  const [authors, setAuthors] = useState([]);
  const [authorSel, setAuthorSel] = useState("");
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [loadingRosco, setLoadingRosco] = useState(false);
  const [customReady, setCustomReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    if (mode === "custom") {
      (async () => {
        setLoadingAuthors(true);
        setError("");
        const res = await listCustomAuthors();
        setLoadingAuthors(false);
        if (!res?.ok) return setError(res?.error || "No se pudo listar autores.");
        setAuthors(res.authors || []);
        if (res.authors?.includes(playerName?.trim())) setAuthorSel(playerName.trim());
      })();
    } else {
      setCustomReady(false);
      setAuthorSel("");
    }
  }, [open, mode, playerName]);

  const handleLoadRosco = async () => {
    if (!authorSel) return setError("Elegí un autor del listado.");
    setLoadingRosco(true);
    setError("");
    const res = await getCustomWordsByAuthor(authorSel);
    setLoadingRosco(false);
    if (!res?.ok) {
      setCustomReady(false);
      setCustomWords([]);
      return setError(res?.error || "No se pudieron cargar las palabras.");
    }
    setCustomWords(res.words || []);
    setCustomReady(true);
  };

  const handleStart = () => {
    if (!playerName.trim()) return setError("Poné tu nombre para registrar estadísticas.");
    if (!mode) return setError("Elegí un modo de juego.");
    if (mode === "random" && !rule) setRule("starts_with");
    if (mode === "custom" && !customReady) return setError("Cargá el rosco del autor antes de empezar.");
    setError("");
    onStart?.({ author: authorSel || null });
  };

  const handleCancel = () => navigate("/");

  if (!open) return null;

  const startDisabled =
    !playerName.trim() ||
    !mode ||
    (mode === "custom" && !customReady);

  return (
    <div className="modal-backdrop" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>¡Comencemos!</h2>

        <label className="field">
          <span>Nombre del jugador</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ej: Gastón"
            onKeyDown={(e) => e.key === "Enter" && !startDisabled && handleStart()}
          />
        </label>

        <fieldset className="field">
          <legend>Modo de juego</legend>
          <label className="radio">
            <input type="radio" name="mode" checked={mode === "random"} onChange={() => setMode("random")} />
            <span>Random (preguntas aleatorias)</span>
          </label>
          <label className="radio">
            <input type="radio" name="mode" checked={mode === "custom"} onChange={() => setMode("custom")} />
            <span>Personalizado (tu propio rosco / de otro jugador)</span>
          </label>
        </fieldset>

        {mode === "random" && (
          <fieldset className="field">
            <legend>Regla para random</legend>
            <label className="radio">
              <input type="radio" name="rule" checked={rule === "starts_with"} onChange={() => setRule("starts_with")} />
              <span>Empieza con la letra</span>
            </label>
          </fieldset>
        )}

        {mode === "custom" && (
          <>
            <div className="field">
              <label>
                <span>Creador del rosco</span>
                <div style={{ display: "flex", gap: ".5rem" }}>
                  <select
                    value={authorSel}
                    onChange={(e) => { setAuthorSel(e.target.value); setCustomReady(false); }}
                    disabled={loadingAuthors}
                  >
                    <option value="">{loadingAuthors ? "Cargando autores..." : "Elegí un autor"}</option>
                    {authors.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <button
                    className="btn"
                    type="button"
                    onClick={handleLoadRosco}
                    disabled={!authorSel || loadingRosco}
                    title={!authorSel ? "Elegí un autor" : "Descargar palabras del autor"}
                  >
                    {loadingRosco ? "Cargando..." : (customReady ? "Recargar" : "Cargar rosco")}
                  </button>
                </div>
                {customReady && <small className="text-ok">✔ Rosco cargado de “{authorSel}”.</small>}
              </label>
            </div>

            <div className="field">
              <button className="btn" type="button" onClick={onOpenCustomBuilder}>
                Crear / editar mis palabras del rosco
              </button>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn" type="button" onClick={handleCancel}>Cancelar</button>
          <button
            className="btn primary"
            type="button"
            onClick={handleStart}
            disabled={startDisabled}
            title={startDisabled ? "Completá los pasos anteriores" : "¡Listo para jugar!"}
          >
            Empezar juego
          </button>
        </div>
      </div>
    </div>
  );
}
