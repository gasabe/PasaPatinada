import React from 'react';
import Game from '../src/pages/Game.jsx';

const parseCsv = (csvText) => {
  const rows = [];
  let i = 0, cur = "", inQuotes = false, row = [];
  const pushCell = () => { row.push(cur); cur = ""; };
  const pushRow  = () => { rows.push(row); row = []; };

  while (i < csvText.length) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") pushCell();
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && csvText[i + 1] === "\n") i++;
        pushCell(); pushRow();
      } else cur += ch;
    }
    i++;
  }
  if (cur.length || row.length) { pushCell(); pushRow(); }
  return rows;
};

export async function fetchQuestionsPublic() {
  const SHEET_ID   = import.meta.env.VITE_SHEET_ID;
  const SHEET_NAME = import.meta.env.VITE_SHEET_NAME || 'Preguntas';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`No se pudo leer el CSV (${res.status})`);
  const csvText = await res.text();

  const rows = parseCsv(csvText);
  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idx = {
    letter: headers.indexOf("letter"),
    clue:   headers.indexOf("clue"),
    answer: headers.indexOf("answer"),
  };
  const data = rows.slice(1)
    .filter(r => r.length && r.some(c => c && c.trim && c.trim()))
    .map(r => ({
      letter: String(r[idx.letter] || "").toUpperCase().trim(),
      clue:   String(r[idx.clue]   || "").trim(),
      answer: String(r[idx.answer] || "").toLowerCase().trim(),
    }))
    .filter(x => x.letter && x.clue && x.answer);

  const byLetter = data.reduce((a, q) => ((a[q.letter] ??= []).push(q), a), {});
  const RING = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
  const selected = RING.filter(L => byLetter[L]).map(L => {
    const arr = byLetter[L];
    return arr[Math.floor(Math.random() * arr.length)];
  });

  return selected;
}
