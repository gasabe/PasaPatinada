import { createContext, useState } from "react";

export const GameSettingsContext = createContext(null);

export function GameSettingsProvider({ children }) {
  const [mode, setMode] = useState(null);                 // "random" | "custom"
  const [rule, setRule] = useState("starts_with");        // random
  const [customWords, setCustomWords] = useState([]);     // palabras cargadas (custom)
  const [playerName, setPlayerName] = useState("");

  const value = {
    mode, setMode,
    rule, setRule,
    customWords, setCustomWords,
    playerName, setPlayerName,
  };

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
}
