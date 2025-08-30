// src/pages/Host.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSettings } from "../../lib/useGameSettings";
import { saveScore, savePlayerStat } from "../../lib/sheets";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export default function Host() {
  const navigate = useNavigate();
  const { playerName, mode, customWords, rule } = useGameSettings();
  const [idx, setIdx] = useState(0);                        // índice en lettersToPlay
  const [status, setStatus] = useState({});                 // { 'A': 'pending|correct|incorrect|pass' }
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);

  // Rosco base a partir del set cargado
  const rosco = useMemo(() => {
    const byLetter = new Map((customWords || []).map(w => [w.letter, w]));
    return ALPHABET.map(L => {
      const w = byLetter.get(L);
      return {
        letter: L,
        clue: w?.clue || "",
        answer: w?.answer || "",
        rule: w?.rule || (rule || "starts_with"),
        hasWord: Boolean(w?.clue && w?.answer),
      };
    });
  }, [customWords, rule]);

  // Solo jugamos letras que tienen palabra
  const lettersToPlay = useMemo(
    () => rosco.filter(r => r.hasWord).map(r => r.letter),
    [rosco]
  );

  // Guardia: si no hay set o no es el modo correcto, redirige
  useEffect(() => {
    if (mode !== "host" || !lettersToPlay.length) {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Inicializa estado
  useEffect(() => {
    const init = {};
    lettersToPlay.forEach(L => { init[L] = "pending"; });
    setStatus(init);
    setIdx(0);
  }, [lettersToPlay.join("")]);

  const currentLetter = lettersToPlay[idx] || null;
  const current = useMemo(
    () => rosco.find(r => r.letter === currentLetter),
    [rosco, currentLetter]
  );

  const goNext = () => {
    if (!lettersToPlay.length) return;
    let next = idx;
    const maxLoops = lettersToPlay.length * 2; // seguridad
    let loops = 0;
    do {
      next = (next + 1) % lettersToPlay.length;
      loops++;
      // saltá letras ya resueltas (correct/incorrect); dejá pendientes y pass
    } while (
      loops < maxLoops &&
      (status[lettersToPlay[next]] === "correct" || status[lettersToPlay[next]] === "incorrect")
    );
    setIdx(next);
    setShowAnswer(false);
  };

  const mark = (kind) => {
    if (!currentLetter) return;
    const nextStatus = { ...status, [currentLetter]: kind }; // 'correct' | 'incorrect' | 'pass'
    setStatus(nextStatus);
    setShowAnswer(false);

    // ¿terminó? (no quedan pending ni pass)
    const remaining = Object.values(nextStatus).some(s => s === "pending" || s === "pass");
    if (!remaining) {
      const ok = Object.values(nextStatus).filter(s => s === "correct").length;
      setScore(ok);
      setFinished(true);
    } else {
      // si fue pass, recorremos; si fue correcto/incorrecto, también avanzamos
      goNext();
    }
  };

  // Recorre nuevamente las "pass" cuando no queden pending
  useEffect(() => {
    if (!lettersToPlay.length) return;
    const values = Object.values(status);
    if (!values.length) return;

    const stillPending = values.includes("pending");
    const stillPass    = values.includes("pass");

    // si ya no hay pending pero sí hay pass, fijate que estemos parados en una pass
    if (!stillPending && stillPass) {
      const passIndex = lettersToPlay.findIndex(L => status[L] === "pass");
      if (passIndex >= 0) setIdx(passIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const total = lettersToPlay.length;
  const corrects = Object.values(status).filter(s => s === "correct").length;
  const incorrects = Object.values(status).filter(s => s === "incorrect").length;

  const percent = total ? Math.round((corrects * 100) / total) : 0;
  const congrats = percent >= 50;

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Guardar score básico si ya usás estas funciones
      await saveScore({
        player: playerName || "Jugador",
        score: corrects,
        total,
        mode: "host",
      });
      await savePlayerStat({
        player: playerName || "Jugador",
        result: percent,
        mode: "host",
      });
    } catch (e) {
      // ignoramos errores silenciosamente en este flujo
    } finally {
      setSaving(false);
      navigate("/ranking");
    }
  };

  if (!current) {
    return (
      <div className="container" style={{ color: "#fff", padding: 24 }}>
        <h2>No hay palabras para jugar.</h2>
        <button className="btn" onClick={() => navigate("/editor")}>Ir al editor</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto", color: "#fff", padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>🎤 Modo Relator</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Letras: {corrects}/{total} ✅ · {incorrects} ❌</span>
          <button className="btn ghost" onClick={() => navigate("/")}>Salir</button>
        </div>
      </header>

      <div
        style={{
          marginTop: 16,
          padding: "1rem",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.1)",
          background: "rgba(20,25,55,.6)",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
          <div
            style={{
              width: 60, height: 60, borderRadius: 999, display: "grid", placeItems: "center",
              background: "rgba(255,255,255,.08)", fontSize: 28, fontWeight: 800
            }}
          >
            {current.letter}
          </div>
          <div>
            <div style={{ opacity: .8, fontSize: 14, marginBottom: 4 }}>
              {current.rule === "starts_with" ? "Empieza con" : "Contiene"} <b>{current.letter}</b>
            </div>
            <div style={{ fontSize: 20 }}>{current.clue}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {!showAnswer ? (
            <button className="btn outline" onClick={() => setShowAnswer(true)}>Mostrar respuesta</button>
          ) : (
            <div style={{ fontSize: 18, padding: "8px 0" }}>
              Respuesta: <b>{current.answer}</b>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button className="btn success" onClick={() => mark("correct")}>Correcto</button>
          <button className="btn warning" onClick={() => mark("pass")}>PasaPatinada</button>
          <button className="btn danger" onClick={() => mark("incorrect")}>Incorrecto</button>
        </div>
      </div>

      {/* Tira de estado del rosco */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
        {lettersToPlay.map(L => {
          const s = status[L] || "pending";
          const isCurrent = L === current.letter;
          const bg =
            s === "correct" ? "rgba(34,197,94,.25)" :
            s === "incorrect" ? "rgba(239,68,68,.25)" :
            s === "pass" ? "rgba(250,204,21,.25)" :
            "rgba(255,255,255,.08)";
          const bdr =
            s === "correct" ? "rgba(34,197,94,.6)" :
            s === "incorrect" ? "rgba(239,68,68,.6)" :
            s === "pass" ? "rgba(250,204,21,.6)" :
            "rgba(255,255,255,.2)";
          return (
            <button
              key={L}
              className="btn"
              style={{
                width: 36, height: 36, padding: 0, borderRadius: 999,
                background: bg, borderColor: isCurrent ? "#60a5fa" : bdr
              }}
              onClick={() => setIdx(lettersToPlay.indexOf(L))}
              title={s}
            >
              {L}
            </button>
          );
        })}
      </div>

      {finished && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <h2>¡Partida terminada!</h2>
            <p style={{ fontSize: 18, marginTop: 8 }}>
              Resultado: <b>{corrects}</b> de <b>{total}</b> ({percent}%)
            </p>
            {congrats && <p style={{ color: "#22c55e", marginTop: 6 }}>🎉 ¡Felicitaciones! Superaste el 50%.</p>}
            <div className="actions" style={{ justifyContent: "center" }}>
              <button className="btn primary" disabled={saving} onClick={handleFinish}>
                {saving ? "Guardando..." : "Ver ranking"}
              </button>
              <button className="btn ghost" onClick={() => navigate("/")}>Inicio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
