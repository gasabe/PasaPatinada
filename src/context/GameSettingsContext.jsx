import { createContext, useState } from "react";

export const GameSettingsContext = createContext(null);

export function GameSettingsProvider({ children }) {
  const [mode, setMode] = useState(null);
  const [rule, setRule] = useState("starts_with");
  const [customWords, setCustomWords] = useState([]);
  const [playerName, setPlayerName] = useState("");

  const value = {
    mode,
    setMode,
    rule,
    setRule,
    customWords,
    setCustomWords,
    playerName,
    setPlayerName,
  };

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
}
