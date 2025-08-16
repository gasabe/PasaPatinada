import { useEffect, useMemo, useState } from "react";
import { fetchQuestionsPublic } from "../../lib/fetchQuestionsPublic.js";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

const norm = (s="") =>
  s.toLowerCase()
   .normalize("NFD").replace(/\p{Diacritic}/gu, "")
   .replace(/[^a-z0-9ñ]/g, "");

export default function Game() {
  const [questions, setQuestions] = useState([]);          // array de preguntas
  const [status, setStatus] = useState({});                // { A:'pending'|'ok'|'bad'|'pass' }
  const [current, setCurrent] = useState("A");             // letra actual
  const [value, setValue] = useState("");                  // input respuesta
  const [secs, setSecs] = useState(150);                   // timer
  const [running, setRunning] = useState(false);           // juego corriendo

  // Traer preguntas del Sheet
  useEffect(() => {
    (async () => {
      const data = await fetchQuestionsPublic();
      // ordenar según rosco y mapear estados iniciales
      const map = new Map(data.map(q => [q.letter, q]));
      const ordered = ALPHABET.filter(L => map.has(L)).map(L => map.get(L));
      setQuestions(ordered);

      const init = {};
      ordered.forEach(q => { init[q.letter] = "pending"; });
      setStatus(init);

      setCurrent(ordered[0]?.letter || "A");
    })().catch(console.error);
  }, []);

  // Timer
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { setRunning(false); return; }
    const id = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, secs]);

  // Acceso por letra O(1)
  const qByLetter = useMemo(() => {
    const m = {}; questions.forEach(q => { m[q.letter] = q; }); return m;
  }, [questions]);

  const goNext = () => {
    if (!questions.length) return;
    const startIdx = ALPHABET.indexOf(current);
    for (let i = 1; i <= ALPHABET.length; i++) {
      const idx = (startIdx + i) % ALPHABET.length;
      const L = ALPHABET[idx];
      if (!qByLetter[L]) continue; // si no hay pregunta para esa letra
      const st = status[L];
      if (st === "pending" || st === "pass") {
        setCurrent(L);
        return;
      }
    }
    // sin pendientes: termina
    setRunning(false);
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const q = qByLetter[current];
    if (!q) return;

    const ok = norm(value) === norm(q.answer);
    setStatus(s => ({ ...s, [current]: ok ? "ok" : "bad" }));
    setValue("");
    goNext();
  };

  const pass = () => {
    const q = qByLetter[current];
    if (!q) return;
    setStatus(s => ({ ...s, [current]: "pass" }));
    setValue("");
    goNext();
  };

  const clickLetter = (L) => {
    if (!qByLetter[L]) return;               // no existe pregunta
    const st = status[L];
    if (st === "pending" || st === "pass") setCurrent(L);
  };

  // Stats
  const stats = useMemo(() => {
    const vals = Object.values(status);
    const ok = vals.filter(v => v === "ok").length;
    const bad = vals.filter(v => v === "bad").length;
    const passCount = vals.filter(v => v === "pass").length;
    return { ok, bad, pass: passCount, total: questions.length, score: ok * 10 - bad * 5 };
  }, [status, questions.length]);

  const start = () => {
    setRunning(true);
    if (secs <= 0) setSecs(150);
    if (!qByLetter[current]) {
      const first = questions[0]?.letter;
      if (first) setCurrent(first);
    }
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

      {/* Teclado con estados */}
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
              >
                {L}
              </button>
            );
          })}
        </div>
        <div className="baseline" />
      </div>

      {/* Panel de pregunta/entrada */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ minHeight: 90 }}>
          {q ? (
            <>
              <h2 style={{ margin: "0 0 8px" }}>Letra: {current}</h2>
              <p style={{ opacity: .9, margin: 0 }}>{q.clue}</p>
            </>
          ) : (
            <p>No hay pregunta para la letra <b>{current}</b>.</p>
          )}
        </div>

        <form onSubmit={submit} className="row" style={{ marginTop: 10 }}>
          <input
            className="input"
            value={value}
            onChange={e => setValue(e.target.value)}
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
    </div>
  );
}
