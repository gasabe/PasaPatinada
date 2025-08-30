import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGameSettings } from "../../lib/useGameSettings";
import { listCustomAuthors, getCustomWordsByAuthor } from "../../lib/sheets";

export default function GameStartModal({ open, onStart }) {
  const {
    mode, setMode,
    rule, setRule,
    playerName, setPlayerName,
    setCustomWords
  } = useGameSettings();

  const [error, setError] = useState("");
  const [authors, setAuthors] = useState([]);
  const [authorSel, setAuthorSel] = useState("");
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [loadingRosco, setLoadingRosco] = useState(false);
  const [customReady, setCustomReady] = useState(false);
  const navigate = useNavigate();

  // Cargar autores cuando el modal abre y el modo requiere autor (custom/host)
  useEffect(() => {
    if (!open) return;
    if (mode === "custom" || mode === "host") {
      let mounted = true;
      (async () => {
        setLoadingAuthors(true);
        setError("");
        const res = await listCustomAuthors();
        setLoadingAuthors(false);
        if (!mounted) return;
        if (!res?.ok) {
          setAuthors([]);
          return setError(res?.error || "No se pudo listar autores.");
        }
        const list = res.authors || [];
        setAuthors(list);

        // Preferir último autor editado (no el player)
        const last = (typeof window !== "undefined" && localStorage.getItem("lastEditedAuthor")) || "";
        if (last && list.includes(last)) setAuthorSel(last);
        else if (list.length && !authorSel) setAuthorSel(list[0]);
      })();
      return () => { mounted = false; };
    } else {
      setCustomReady(false);
      setAuthorSel("");
      setCustomWords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // Carga automática del rosco cuando cambia el autor seleccionado
  useEffect(() => {
    if (!open || !(mode === "custom" || mode === "host")) return;
    if (!authorSel) {
      setCustomReady(false);
      setCustomWords([]);
      return;
    }
    let mounted = true;
    (async () => {
      setLoadingRosco(true);
      setError("");
      const res = await getCustomWordsByAuthor(authorSel);
      setLoadingRosco(false);
      if (!mounted) return;
      if (!res?.ok) {
        setCustomReady(false);
        setCustomWords([]);
        return setError(res?.error || "No se pudieron cargar las palabras del autor.");
      }
      setCustomWords(res.words || []);
      setCustomReady(true);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorSel]);

  const handleStart = () => {
    if (!playerName.trim()) return setError("Poné tu nombre para registrar estadísticas.");
    if (!mode) return setError("Elegí un modo de juego.");

    if (mode === "random") {
      if (!rule) setRule("starts_with");
      setError("");
      onStart?.({ author: null });
      return;
    }

    // custom y host requieren set cargado
    if (!customReady) return setError("Esperá a que se cargue el rosco del autor.");
    setError("");

    if (mode === "host") {
      navigate("/host", { replace: true });
      return;
    }

    // custom normal
    onStart?.({ author: authorSel || null });
  };

  const handleCancel = () => navigate("/");

  if (!open) return null;

  const startDisabled =
    !playerName.trim() ||
    !mode ||
    ((mode === "custom" || mode === "host") && (!authorSel || !customReady || loadingRosco));

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
            <input
              type="radio"
              name="mode"
              checked={mode === "random"}
              onChange={() => setMode("random")}
            />
            <span>Random (preguntas aleatorias)</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="mode"
              checked={mode === "custom"}
              onChange={() => setMode("custom")}
            />
            <span>Personalizado (tu propio rosco / de otro jugador)</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="mode"
              checked={mode === "host"}
              onChange={() => setMode("host")}
            />
            <span>Relator (vos presentás y marcás: correcto / pasapatinada / incorrecto)</span>
          </label>
        </fieldset>

{/*         {mode === "random" && (
          <fieldset className="field">
            <legend>Regla para random</legend>
            <label className="radio">
              <input
                type="radio"
                name="rule"
                checked={rule === "starts_with"}
                onChange={() => setRule("starts_with")}
              />
              <span>Empieza con la letra</span>
            </label>
          </fieldset>
        )} */}

        {(mode === "custom" || mode === "host") && (
          <div className="field">
            <label>
              <span>Creador del rosco</span>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <select
                  value={authorSel}
                  onChange={(e) => setAuthorSel(e.target.value)}
                  disabled={loadingAuthors}
                >
                  {!authors.length && (
                    <option value="">
                      {loadingAuthors ? "Cargando autores..." : "No hay autores"}
                    </option>
                  )}
                  {!!authors.length && <option value="">Elegí un autor</option>}
                  {authors.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>

                {/* Pasar SIEMPRE el autor seleccionado al editor */}
                <Link
                  to={{
                    pathname: "/editor",
                    search: authorSel ? `?author=${encodeURIComponent(authorSel)}` : "",
                  }}
                  state={{ author: authorSel || "" }}
                  className="btn outline"
                  title="Crear / editar palabras del autor seleccionado"
                >
                  Editar mis palabras
                </Link>
              </div>
              {loadingRosco && <small>Descargando rosco...</small>}
              {customReady && authorSel && !loadingRosco && (
                <small className="text-ok">✔ Rosco de “{authorSel}” listo.</small>
              )}
            </label>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn ghost" type="button" onClick={handleCancel}>Cancelar</button>
          <button
            className="btn primary"
            type="button"
            onClick={handleStart}
            disabled={startDisabled}
            title={startDisabled ? "Completá los pasos anteriores" : "¡Listo para jugar!"}
          >
            {mode === "host" ? "Ir al modo Relator" : "Empezar juego"}
          </button>
        </div>
      </div>
    </div>
  );
}
