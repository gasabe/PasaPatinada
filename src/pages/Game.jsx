import { useEffect, useState } from "react";
import { fetchQuestionsPublic } from "../../lib/fetchQuestionsPublic.js";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export default function Game() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState({});
  const [timeLeft, setTimeLeft] = useState(150); // 150 segundos

  useEffect(() => {
    fetchQuestionsPublic().then((data) => setQuestions(data));
  }, []);

  // contador regresivo
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!questions.length) return <p>Cargando preguntas...</p>;
  if (timeLeft <= 0) return <h2>⏱️ Tiempo agotado</h2>;

  const q = questions.find((q) => q.letter === ALPHABET[current]);

  const check = () => {
    if (!q) return;
    if (answer.trim().toLowerCase() === q.answer) {
      setCorrect((c) => ({ ...c, [q.letter]: "ok" }));
    } else {
      setCorrect((c) => ({ ...c, [q.letter]: "bad" }));
    }
    setAnswer("");
    setCurrent((i) => (i + 1) % ALPHABET.length); // pasa a la siguiente letra
  };

  const pass = () => {
    setCorrect((c) => ({ ...c, [q.letter]: "pass" }));
    setCurrent((i) => (i + 1) % ALPHABET.length);
  };

  return (
    <div className="game">
      <h2>Tiempo restante: {timeLeft}s</h2>
      <div className="question">
        <h3>{q?.clue}</h3>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        <button onClick={check}>Responder</button>
        <button onClick={pass}>Pasapalabra</button>
      </div>

      <div className="rosco">
        {ALPHABET.map((L) => (
          <span key={L} className={`tile ${correct[L] || ""}`}>
            {L}
          </span>
        ))}
      </div>
    </div>
  );
}
