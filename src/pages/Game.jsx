import { useEffect, useMemo, useState } from "react";
import { fetchQuestionsPublic } from "../../lib/fetchQuestionsPublic.js";
import "../../src/styles/Game.css"; // Asegurate de tener este import

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

const norm = (s = "") =>
  s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9ñ]/g, "");

/** Reglas opcionales */
function isCorrect({ answer, rule, letter }, userInput) {
  const u = norm(userInput);
  const a = norm(answer);
  if (!u || !a) return false;
  if (u !== a) return false;

  const r = rule || "none";
  const L = String(letter || "").toLowerCase();
  if (r === "starts_with") return a.startsWith(L);
  if (r === "contains") return a.includes(L);
  return true; // none
}

function inferRule(letter, answer) {
  const L = String(letter || "").toLowerCase();
  const a = norm(answer || "");
  if (!L || !a) return "none";
  if (a.startsWith(L)) return "starts_with";
  if (a.includes(L)) return "contains";
  return "none";
}

export default function Game() {
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState({});        // { A:'pending'|'ok'|'bad'|'pass' }
  const [current, setCurrent] = useState("A");
  const [value, setValue] = useState("");
  const [secs, setSecs] = useState(150);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'ok' | 'bad' | null

  // Modal fin de juego
  const [gameOver, setGameOver] = useState({
    open: false,
    outcome: "lose",      // 'win' | 'lose' | 'time'
    title: "",
    message: "",
  });

  // Cargar preguntas
  useEffect(() => {
    (async () => {
      const data = await fetchQuestionsPublic();
      const byLetter = new Map(
        (data || []).map((row) => {
          const letter = row.letter || row.L || row.l || "";
          const clue   = row.clue   || row.prompt || row.pista || `Con la ${letter}…`;
          const answer = row.answer ?? "";
          const ruleRaw = row.rule;
          const rule = (ruleRaw === "starts_with" || ruleRaw === "contains")
            ? ruleRaw
            : inferRule(letter, answer);
          return [letter, { letter, clue, answer, rule }];
        })
      );
      const ordered = ALPHABET.filter((L) => byLetter.has(L)).map((L) => byLetter.get(L));
      setQuestions(ordered);

      const init = {};
      ordered.forEach((q) => { init[q.letter] = "pending"; });
      setStatus(init);

      setCurrent(ordered[0]?.letter || "A");
      setLastResult(null);
      setValue("");
      setRunning(false);
      setSecs(150);
      setGameOver((g) => ({ ...g, open: false }));
    })().catch(console.error);
  }, []);

  // Timer
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) {
      setRunning(false);
      openEndModal("time");
      return;
    }
    const id = setInterval(() => setSecs((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secs]);

  // Acceso O(1)
  const qByLetter = useMemo(() => {
    const m = {};
    questions.forEach((q) => { m[q.letter] = q; });
    return m;
  }, [questions]);

  // Stats
  const stats = useMemo(() => {
    const vals = Object.values(status);
    const ok = vals.filter((v) => v === "ok").length;
    const bad = vals.filter((v) => v === "bad").length;
    const passCount = vals.filter((v) => v === "pass").length;
    const total = questions.length;
    return { ok, bad, pass: passCount, total, score: ok * 10 - bad * 5 };
  }, [status, questions.length]);

  const remaining = useMemo(() => {
    // pendientes o pasapalabras
    return Object.entries(status)
      .filter(([L, st]) => st === "pending" || st === "pass")
      .map(([L]) => L);
  }, [status]);

  const openEndModal = (reason) => {
    // Win si todas las que existen están en ok
    const allAnswered = questions.length > 0 &&
      questions.every((q) => status[q.letter] === "ok");
    let outcome = "lose";
    let title = "Fin del juego";
    let message = "";

    if (reason === "time") {
      outcome = allAnswered ? "win" : "time";
      title = outcome === "win" ? "¡Ganaste!" : "¡Se acabó el tiempo!";
      message = outcome === "win"
        ? "Completaste todo el rosco a tiempo."
        : "Se terminó el tiempo, probá de nuevo.";
    } else {
      outcome = allAnswered ? "win" : "lose";
      title = outcome === "win" ? "¡Ganaste!" : "Rosco terminado";
      message = outcome === "win"
        ? "¡Excelente! Todas correctas."
        : "Terminaste el rosco. Podés reintentar para mejorar el puntaje.";
    }

    setGameOver({ open: true, outcome, title, message });
  };

  const goNext = () => {
    if (!questions.length) return;
    const startIdx = ALPHABET.indexOf(current);
    for (let i = 1; i <= ALPHABET.length; i++) {
      const idx = (startIdx + i) % ALPHABET.length;
      const L = ALPHABET[idx];
      if (!qByLetter[L]) continue;
      const st = status[L];
      if (st === "pending" || st === "pass") {
        setCurrent(L);
        return;
      }
    }
    // no queda ninguna pendiente/pasada
    setRunning(false);
    openEndModal("done");
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const q = qByLetter[current];
    if (!q) return;

    const ok = isCorrect(
      { answer: q.answer, rule: q.rule, letter: q.letter },
      value
    );

    setStatus((s) => ({ ...s, [current]: ok ? "ok" : "bad" }));
    setLastResult(ok ? "ok" : "bad");
    setValue("");
    goNext();
  };

  const pass = () => {
    const q = qByLetter[current];
    if (!q) return;
    setStatus((s) => ({ ...s, [current]: "pass" }));
    setLastResult(null);
    setValue("");
    goNext();
  };

  const clickLetter = (L) => {
    if (!qByLetter[L]) return;
    const st = status[L];
    if (st === "pending" || st === "pass") setCurrent(L);
  };

  const start = () => {
    setRunning(true);
    setLastResult(null);
    if (secs <= 0) setSecs(150);
    if (!qByLetter[current]) {
      const first = questions[0]?.letter;
      if (first) setCurrent(first);
    }
  };

  const resetGame = () => {
    // Resetea estados pero conserva las mismas preguntas cargadas
    const init = {};
    questions.forEach((q) => { init[q.letter] = "pending"; });
    setStatus(init);
    setCurrent(questions[0]?.letter || "A");
    setValue("");
    setSecs(150);
    setRunning(false);
    setLastResult(null);
    setGameOver((g) => ({ ...g, open: false }));
  };

  const q = qByLetter[current];

  return (
    <div className="game-wrap">
      {/* HUD */}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div>✅ {stats.ok} &nbsp;|&nbsp; ❌ {stats.bad} &nbsp;|&nbsp; ⏭️ {stats.pass}</div>
        <div>🧮 Puntaje: <b>{stats.score}</b></div>
        <div>⏱️ {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</div>
      </div>

      {/* Rosco */}
      <div className="letters-wrap">
        <div className="letters-inner">
          {ALPHABET.map((L) => {
            if (!qByLetter[L]) {
              return <button key={L} className="key key--disabled" type="button">{L}</button>;
            }
            const st = status[L] || "pending";
            const isActive = L === current && running;
            return (
              <button
                key={L}
                type="button"
                className={[
                  "key",
                  isActive ? "key--active" : "",
                  st === "ok"   ? "key--ok"   : "",
                  st === "bad"  ? "key--bad"  : "",
                  st === "pass" ? "key--pass" : "",
                ].join(" ").trim()}
                onClick={() => clickLetter(L)}
                title={st}
              >
                {L}
              </button>
            );
          })}
        </div>
        <div className="baseline" />
      </div>

      {/* Panel pregunta */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ minHeight: 90 }}>
          {q ? (
            <>
              <h2 style={{ margin: "0 0 8px" }}>Letra: {current}</h2>
              <p style={{ opacity: .9, margin: 0 }}>{q.clue}</p>
              {/* <small style={{ opacity:.7 }}>Regla: {q.rule}</small> */}
            </>
          ) : (
            <p>No hay pregunta para la letra <b>{current}</b>.</p>
          )}
        </div>

        <form onSubmit={submit} className="row" style={{ marginTop: 10 }}>
          <input
            className={[
              "input",
              lastResult === "ok" ? "input--ok" : "",
              lastResult === "bad" ? "input--bad" : "",
            ].join(" ").trim()}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tu respuesta…"
            disabled={!running || !q || secs <= 0}
          />
          <button className="btn btn-primary" disabled={!running || secs <= 0}>Responder</button>
          <button type="button" className="btn btn-ghost" onClick={pass} disabled={!running || secs <= 0}>Pasapalabra</button>
        </form>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={start} disabled={running}>
            {secs <= 0 ? "Reintentar" : "Comenzar"}
          </button>
        </div>
      </div>

      {/* MODAL FIN DE JUEGO */}
      {gameOver.open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 className={`modal-title ${gameOver.outcome === "win" ? "win" : gameOver.outcome === "time" ? "time" : "lose"}`}>
              {gameOver.title}
            </h3>

            <p className="modal-message">{gameOver.message}</p>

            <div className="modal-stats">
              <div><strong>✅ Correctas:</strong> {stats.ok}</div>
              <div><strong>❌ Incorrectas:</strong> {stats.bad}</div>
              <div><strong>⏭️ Pasapalabras:</strong> {stats.pass}</div>
              <div><strong>🧮 Puntaje:</strong> {stats.score}</div>
            </div>

            {remaining.length > 0 && (
              <details className="modal-remaining">
                <summary>Ver letras pendientes</summary>
                <div className="remaining-list">
                  {remaining.map((L) => <span key={L} className="pill">{L}</span>)}
                </div>
              </details>
            )}

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={resetGame}>Reintentar</button>
              <button className="btn btn-ghost" onClick={() => setGameOver((g) => ({ ...g, open: false }))}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
