import { useState } from "react";
import { useNavigate } from "react-router-dom";         // 🆕
import { useGameSettings } from "../../lib/useGameSettings";

export default function GameStartModal({ open, onStart, onOpenCustomBuilder }) {
  const { mode, setMode, rule, setRule, playerName, setPlayerName } = useGameSettings();
  const [error, setError] = useState("");
  const navigate = useNavigate();                       // 🆕

  if (!open) return null;

  const handleStart = () => {
    if (!playerName.trim()) return setError("Poné tu nombre para registrar estadísticas.");
    if (!mode) return setError("Elegí un modo de juego.");
    if (mode === "random" && !rule) setRule("starts_with");
    setError("");
    onStart?.();
  };

  const handleCancel = () => navigate("/");            // 🆕 ir a Inicio

  return (
    <div className="modal-backdrop" onClick={handleCancel}> {/* opcional: click fuera también vuelve */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>¡Comencemos!</h2>

        <label className="field">
          <span>Nombre del jugador</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ej: Gastón"
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
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
            <span>Personalizado (tu propio rosco)</span>
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
          <div className="field">
            <button className="btn" type="button" onClick={onOpenCustomBuilder}>
              Crear / editar palabras del rosco
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="btn" type="button" onClick={handleCancel}>Cancelar</button> {/* 🆕 */}
          <button className="btn primary" type="button" onClick={handleStart}>Empezar juego</button>
        </div>
      </div>
    </div>
  );
}
