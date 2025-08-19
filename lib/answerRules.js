// src/lib/answerRules.js
const norm = (s = "") =>
  s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9ñ]/g, "");

export function isCorrect({ answer, rule, letter }, userInput) {
  const u = norm(userInput);
  const a = norm(answer);
  if (!u || !a) return false;

  if (u !== a) return false;

  const L = String(letter || "").toLowerCase();
  const r = rule === "contains" || rule === "starts_with" ? rule : "starts_with";

  if (r === "starts_with") return a.startsWith(L);
  if (r === "contains")    return a.includes(L);

  return true;
}
