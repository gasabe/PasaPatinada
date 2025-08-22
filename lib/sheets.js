// src/lib/sheets.js

const WEBAPP_URL =
  import.meta.env.VITE_SHEETS_WEBAPP_URL ||
  "https://script.google.com/macros/s/AKfycbx6nqM-_DR2Qoa96eIyGd1x1ki3-DdTvsr3qnmn-cN84blSQLz0fAwrCfQGBigdQ20R/exec";

// Request “simple” sin headers para evitar errores CORS
async function post(payload) {
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify(payload), // No pongas headers
  });

  const text = await res.text();
  try {
    return JSON.parse(text); // Si devuelve JSON válido
  } catch {
    return { ok: true, raw: text }; // Por si devuelve texto plano
  }
}

// 🟢 Guarda puntaje (sheet: Scores)
export async function saveScore({
  player,
  score,
  mode,
  date = new Date().toISOString(),
}) {
  return post({
    action: "saveScore",
    data: { player, score, mode, date },
  });
}

// 🟢 Guarda estadísticas por jugador (sheet: PlayersStats)
export async function savePlayerStat({
  player,
  correct,
  wrong,
  passed,
  mode,
  durationMs,
  date = new Date().toISOString(),
}) {
  return post({
    action: "savePlayerStat",
    data: { player, correct, wrong, passed, mode, durationMs, date },
  });
}

// 🟢 Guarda palabras personalizadas creadas por el jugador (sheet: CustomWords)
export async function saveCustomWords({ author, words }) {
  return post({
    action: "saveCustomWords",
    data: { author, words },
  });
}
