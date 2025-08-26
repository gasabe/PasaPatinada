
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbz7qA6xuxDGDl6xMklgZNTHXVF_5akwJe6VrdJ1YEAaO842TQ_20-5zilFgqeUhin2SZQ/exec";



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

export async function getRanking({ mode = null, top = 20, perPlayerBest = true } = {}) {
  return post({
    action: "getRanking",
    data: { mode, top, perPlayerBest },
  });
}

export async function listCustomAuthors() {
  return post({ action: "listCustomAuthors" });
}

export async function getCustomWordsByAuthor(author) {
  return post({ action: "getCustomWordsByAuthor", data: { author } });
}