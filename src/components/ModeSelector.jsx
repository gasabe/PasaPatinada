import React from "react";
import "../styles/ModeSelector.css"; // Assuming you have a CSS file for styles

export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <input
          type="radio"
          name="mode"
          value="random"
          checked={mode === "random"}
          onChange={() => onChange("random")}
        />
        Random (Sheet)
      </label>

      <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <input
          type="radio"
          name="mode"
          value="custom"
          checked={mode === "custom"}
          onChange={() => onChange("custom")}
        />
        Personalizado
      </label>
    </div>
  );
}
