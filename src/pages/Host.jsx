// src/pages/Host.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSettings } from "../../lib/useGameSettings";
import { saveScore, savePlayerStat } from "../../lib/sheets";
import "../styles/host.css"; // <-- relativo

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export default function Host() {
  const navigate = useNavigate();
  const { playerName, mode, customWords, rule } = useGameSettings();

  // juego
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState({}); // { A: 'pending|correct|incorrect|pass' }
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  // NEW: contador de puntos (defensivo, además de status)
  const [points, setPoints] = useState(0);

  // timer
  const [secs, setSecs] = useState(150);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(null);

  // NEW: guardado único al finalizar (evita duplicados)
  const savedRef = useRef(false);

  const rosco = useMemo(() => {
    const byLetter = new Map((customWords || []).map((w) => [w.letter, w]));
    return ALPHABET.map((L) => {
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

  const lettersToPlay = useMemo(
    () => rosco.filter((r) => r.hasWord).map((r) => r.letter),
    [rosco]
  );

  useEffect(() => {
    if (mode !== "host" || !lettersToPlay.length) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const init = {};
    lettersToPlay.forEach((L) => (init[L] = "pending"));
    setStatus(init);
    setIdx(0);
    setShowAnswer(false);
    setFinished(false);
    setPoints(0);              // <-- reset puntos
    savedRef.current = false;  // <-- aún no guardado

    setSecs(150);
    setRunning(!!lettersToPlay.length);
    startedAt.current = Date.now();
  }, [lettersToPlay.join("")]);

  useEffect(() => {
    if (!running || finished) return;
    if (secs <= 0) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const id = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secs, finished]);

  const currentLetter = lettersToPlay[idx] || null;
  const current = useMemo(
    () => rosco.find((r) => r.letter === currentLetter),
    [rosco, currentLetter]
  );

  const goNext = () => {
    if (!lettersToPlay.length) return;
    let next = idx;
    const maxLoops = lettersToPlay.length * 2;
    let loops = 0;
    do {
      next = (next + 1) % lettersToPlay.length;
      loops++;
    } while (
      loops < maxLoops &&
      (status[lettersToPlay[next]] === "correct" ||
        status[lettersToPlay[next]] === "incorrect")
    );
    setIdx(next);
    setShowAnswer(false);
  };

  const mark = (kind) => {
    if (!currentLetter || finished || !running) return;

    // si ya estaba "correct", no volver a sumar
    const was = status[currentLetter];
    const nextStatus = { ...status, [currentLetter]: kind };
    setStatus(nextStatus);
    setShowAnswer(false);

    // NEW: sumar punto solo si pasa de algo != 'correct' a 'correct'
    if (kind === "correct" && was !== "correct") {
      setPoints((p) => p + 1);
    }
    // NEW: si corrigen de 'correct' a otro estado, restar (poco frecuente, pero consistente)
    if (kind !== "correct" && was === "correct") {
      setPoints((p) => Math.max(0, p - 1));
    }

    const remaining = Object.values(nextStatus).some(
      (s) => s === "pending" || s === "pass"
    );
    if (!remaining) {
      setFinished(true);
      setRunning(false);
    } else {
      goNext();
    }
  };

  useEffect(() => {
    if (!lettersToPlay.length) return;
    const values = Object.values(status);
    if (!values.length) return;
    const stillPending = values.includes("pending");
    const stillPass = values.includes("pass");
    if (!stillPending && stillPass) {
      const passIndex = lettersToPlay.findIndex((L) => status[L] === "pass");
      if (passIndex >= 0) {
        setIdx(passIndex);
        setShowAnswer(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const total = lettersToPlay.length;
  const corrects = Object.values(status).filter((s) => s === "correct").length;

  // usamos el mayor entre ambos para robustez visual/persistencia
  const score = Math.max(points, corrects);

  const incorrects = Object.values(status).filter((s) => s === "incorrect").length;
  const percent = total ? Math.round((score * 100) / total) : 0;
  const congrats = percent >= 50;

  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");

  // NEW: función de guardado con cerrojo
  const persistScoreOnce = async () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setSaving(true);
    try {
      const durationMs = Date.now() - (startedAt.current || Date.now());
      await saveScore({
        player: playerName || "Jugador",
        score,                // <-- puntos
        total,
        mode: "host",         // asegúrate de que el Ranking incluya 'host'
        // opcional: timestamp/author si tu backend lo soporta
      });
      await savePlayerStat({
        player: playerName || "Jugador",
        result: percent,
        mode: "host",
        durationMs,
      });
    } catch (_e) {
      // swallow
    } finally {
      setSaving(false);
    }
  };

  // NEW: guardado automático al finalizar por tiempo o por completar
  useEffect(() => {
    if (finished || secs <= 0) {
      persistScoreOnce();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, secs <= 0]);

  const handleFinish = async () => {
    // ya estará guardado por el efecto; por las dudas, intentar una vez más
    await persistScoreOnce();
    navigate("/ranking");
  };

  if (!current) {
    return (
      <div className="container host" style={{ padding: 24 }}>
        <h2>No hay palabras para jugar.</h2>
        <button className="btn" onClick={() => navigate("/editor")}>
          Ir al editor
        </button>
      </div>
    );
  }

  return (
    <div className="container host">
      <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span role="img" aria-label="mic">🎤</span> Modo Relator
      </h1>

      <div className="host-pills">
        <span className="pill ok"><b>{score}</b>/<b>{total}</b> ✓</span>
        <span className="pill err"><b>{incorrects}</b> ✗</span>
        <span className="pill time" title="Tiempo restante">⏱ {mm}:{ss}</span>
        <button className="btn ghost" onClick={() => navigate("/")}>Salir</button>
      </div>

      {/* ... resto igual ... */}

      {(finished || secs <= 0) && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <h2>{secs <= 0 ? "¡Se acabó el tiempo!" : "¡Partida terminada!"}</h2>
            <p style={{ fontSize: 18, marginTop: 8 }}>
              Resultado: <b>{score}</b> de <b>{total}</b> ({percent}%)
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
