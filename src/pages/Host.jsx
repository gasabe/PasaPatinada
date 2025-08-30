// src/pages/Host.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSettings } from "../../lib/useGameSettings";
import { saveScore, savePlayerStat } from "../../lib/sheets";
import "/src/styles/host.css";


const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export default function Host() {
  const navigate = useNavigate();
  const { playerName, mode, customWords, rule } = useGameSettings();

  // juego
  const [idx, setIdx] = useState(0);            // índice en lettersToPlay
  const [status, setStatus] = useState({});     // { 'A': 'pending|correct|incorrect|pass' }
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  // timer
  const [secs, setSecs] = useState(150);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(null);

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

  // Solo jugamos letras con palabra
  const lettersToPlay = useMemo(
    () => rosco.filter(r => r.hasWord).map(r => r.letter),
    [rosco]
  );

  // Guardia
  useEffect(() => {
    if (mode !== "host" || !lettersToPlay.length) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Inicializa estado (incluye timer)
  useEffect(() => {
    const init = {};
    lettersToPlay.forEach(L => { init[L] = "pending"; });
    setStatus(init);
    setIdx(0);
    setShowAnswer(false);
    setFinished(false);

    // timer
    setSecs(150);
    setRunning(!!lettersToPlay.length);
    startedAt.current = Date.now();
  }, [lettersToPlay.join("")]);

  // Countdown
  useEffect(() => {
    if (!running || finished) return;
    if (secs <= 0) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const id = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secs, finished]);

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
      // saltá letras ya resueltas (correct/incorrect); dejá pending y pass
    } while (
      loops < maxLoops &&
      (status[lettersToPlay[next]] === "correct" || status[lettersToPlay[next]] === "incorrect")
    );
    setIdx(next);
    setShowAnswer(false);
  };

  const mark = (kind) => {
    if (!currentLetter || finished || !running) return;
    const nextStatus = { ...status, [currentLetter]: kind }; // 'correct' | 'incorrect' | 'pass'
    setStatus(nextStatus);
    setShowAnswer(false);

    // ¿terminó? (no quedan pending ni pass)
    const remaining = Object.values(nextStatus).some(s => s === "pending" || s === "pass");
    if (!remaining) {
      setFinished(true);
      setRunning(false);
    } else {
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

    // si ya no hay pending pero sí hay pass, ubicarse en la primera pass
    if (!stillPending && stillPass) {
      const passIndex = lettersToPlay.findIndex(L => status[L] === "pass");
      if (passIndex >= 0) {
        setIdx(passIndex);
        setShowAnswer(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const total = lettersToPlay.length;
  const corrects = Object.values(status).filter(s => s === "correct").length;
  const incorrects = Object.values(status).filter(s => s === "incorrect").length;

  const percent = total ? Math.round((corrects * 100) / total) : 0;
  const congrats = percent >= 50;

  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");

  const handleFinish = async () => {
    setSaving(true);
    try {
      const durationMs = Date.now() - (startedAt.current || Date.now());
      // Guardar score básico
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
        durationMs,
      });
    } catch (_e) {
      // ignorar
    } finally {
      setSaving(false);
      navigate("/ranking");
    }
  };

  if (!current) {
    return (
      <div className="container host" style={{ padding: 24 }}>
        <h2>No hay palabras para jugar.</h2>
        <button className="btn" onClick={() => navigate("/editor")}>Ir al editor</button>
      </div>
    );
  }

  return (
    <div className="container host">
      {/* Header */}

        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span role="img" aria-label="mic">🎤</span> Modo Relator
        </h1>
        <div className="host-pills">
          <span className="pill ok"><b>{corrects}</b>/<b>{total}</b> ✓</span>
          <span className="pill err"><b>{incorrects}</b> ✗</span>
          <span className="pill time" title="Tiempo restante">⏱ {mm}:{ss}</span>
          <button className="btn ghost" onClick={() => navigate("/")}>Salir</button>
        </div>


      {/* Tarjeta principal */}
      <div className="host-card">
        <div className="row" style={{ gap: 16, alignItems: "center", marginBottom: 12 }}>
          <div className="letter-circle">{current.letter}</div>
          <div>
            <div className="clue-meta">
              {current.rule === "starts_with" ? "Empieza con" : "Contiene"} <b>{current.letter}</b>
            </div>
            <div className="clue-text">{current.clue}</div>
          </div>
        </div>

        {/* Respuesta con toggle */}
        <div className={`host-answer ${showAnswer ? "revealed" : ""}`}>
          {showAnswer ? (
            <div className="space-between">
              <div style={{ fontSize: 18 }}>
                Respuesta: <b>{current.answer}</b>
              </div>
              <button className="btn outline" onClick={() => setShowAnswer(false)}>
                Ocultar respuesta
              </button>
            </div>
          ) : (
            <button className="btn outline" onClick={() => setShowAnswer(true)}>
              Mostrar respuesta
            </button>
          )}
        </div>

        {/* Botonera */}
        <div className="row" style={{ gap: 12, marginTop: 16 }}>
          <button className="btn success" onClick={() => mark("correct")} disabled={!running || finished}>Correcto</button>
          <button className="btn warning" onClick={() => mark("pass")}     disabled={!running || finished}>PasaPatinada</button>
          <button className="btn danger"  onClick={() => mark("incorrect")} disabled={!running || finished}>Incorrecto</button>
        </div>
      </div>

      {/* Tira de letras */}
      <div className="host-strip">
        {lettersToPlay.map(L => {
          const s = status[L] || "pending";
          const isCurrent = L === current.letter;
          const classes = [
            "btn",
            isCurrent ? "is-current" : "",
            s === "correct" ? "state-correct" :
            s === "incorrect" ? "state-incorrect" :
            s === "pass" ? "state-pass" : ""
          ].join(" ").trim();

          return (
            <button
              key={L}
              className={classes}
              onClick={() => { setIdx(lettersToPlay.indexOf(L)); setShowAnswer(false); }}
              title={s}
            >
              {L}
            </button>
          );
        })}
      </div>

      {/* Modal fin por tiempo o por completar */}
      {(finished || secs <= 0) && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <h2>{secs <= 0 ? "¡Se acabó el tiempo!" : "¡Partida terminada!"}</h2>
            <p style={{ fontSize: 18, marginTop: 8 }}>
              Resultado: <b>{corrects}</b> de <b>{total}</b> ({percent}%)
            </p>
            {percent >= 50 && <p style={{ color: "#22c55e", marginTop: 6 }}>🎉 ¡Felicitaciones! Superaste el 50%.</p>}
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
