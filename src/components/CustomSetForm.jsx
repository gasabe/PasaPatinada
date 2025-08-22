import React, { useMemo } from "react";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export default function CustomSetForm({ value, onChange, onReady }) {
  // value: { [letter]: { prompt, answer, rule } }
  const rows = useMemo(() => ALPHABET, []);

  const handleField = (letter, field, v) => {
    onChange({
      ...value,
      [letter]: {
        prompt: value[letter]?.prompt ?? "",
        answer: value[letter]?.answer ?? "",
        rule: value[letter]?.rule ?? "starts_with",
        [field]: v,
      },
    });
  };

  const buildQuestions = () => {
    const qs = rows.map((letter) => {
      const item = value[letter] ?? {};
      return {
        letter,
        prompt: item.prompt?.trim() || `Con la ${letter}…`,
        answer: (item.answer ?? "").trim(),
        rule: item.rule || "starts_with",
      };
    });
    onReady(qs);
  };

  return (
    <div className="custom-set">
      <div style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 1fr 160px",
        gap: 8,
        alignItems: "center",
        marginBottom: 12,
      }}>
        <div><b>Letra</b></div>
        <div><b>Pista</b></div>
        <div><b>Respuesta</b></div>
        <div><b>Regla</b></div>

        {rows.map((letter) => (
          <React.Fragment key={letter}>
            <div>{letter}</div>

            <input
              placeholder={`Pista (Con la ${letter}...)`}
              value={value[letter]?.prompt ?? ""}
              onChange={(e) => handleField(letter, "prompt", e.target.value)}
            />

            <input
              placeholder="Respuesta"
              value={value[letter]?.answer ?? ""}
              onChange={(e) => handleField(letter, "answer", e.target.value)}
            />

            <select
              value={value[letter]?.rule ?? "starts_with"}
              onChange={(e) => handleField(letter, "rule", e.target.value)}
            >
              <option value="starts_with">Empieza con la letra</option>
              <option value="contains">Contiene la letra</option>
            </select>
          </React.Fragment>
        ))}
      </div>

      <button onClick={buildQuestions}>Usar este set</button>
    </div>
  );
}
