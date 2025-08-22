import { useContext } from "react";
import { GameSettingsContext } from "../src/context/GameSettingsContext";

export function useGameSettings() {
  const ctx = useContext(GameSettingsContext);
  if (!ctx) {
    throw new Error("useGameSettings must be used within GameSettingsProvider");
  }
  return ctx;
}
