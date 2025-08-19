// Recibe el array que te entrega fetchQuestionsPublic() y lo normaliza.
const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

const norm = (s = "") =>
  s.toLowerCase()
   .normalize("NFD").replace(/\p{Diacritic}/gu, "")
   .replace(/[^a-z0-9ñ]/g, "");

export function mapSheetToQuestions(sheetRows = []) {
  // Ejemplo esperado de row (ajustá campos reales del Sheet):
  // { letter: "A", clue: "Con la A...", answer: "Ancla", rule: "starts_with" }
  // Si el sheet no trae letter, infiere por índice.
  return ALPHABET.map((letter, idx) => {
    const r = sheetRows[idx] ?? {};
    const rule =
      r.rule === "contains" || r.rule === "starts_with" ? r.rule : "starts_with";

    const answer = r.answer ? norm(r.answer) : "";

    return {
      letter,
      prompt: r.clue || `Con la ${letter}…`,
      answer,
      rule,
    };
  });
}
