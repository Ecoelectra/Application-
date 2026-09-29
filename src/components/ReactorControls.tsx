import { formatPressure, formatTemperature, type WorkbenchConditions } from '../chem/workbench';

/** Schnellwahl für den Temperaturregler (°C). */
export const TEMPERATURE_PRESETS: Array<{ value: number; label: string; icon: string }> = [
  { value: -78, label: 'Trockeneis', icon: '🧊' },
  { value: 0, label: 'Eisbad', icon: '❄' },
  { value: 20, label: 'Raum', icon: '🌡' },
  { value: 80, label: 'Wasserbad', icon: '♨' },
  { value: 300, label: 'Brenner', icon: '🔥' },
  { value: 900, label: 'Glühen', icon: '☀' },
];

/** Schnellwahl für den Druckregler (bar). */
export const PRESSURE_PRESETS: Array<{ value: number; label: string }> = [
  { value: 0.02, label: 'Vakuum' },
  { value: 1.013, label: 'Normaldruck' },
  { value: 10, label: 'Druckgefäß' },
  { value: 200, label: 'Hochdruck' },
];

export const TEMPERATURE_MIN = -100;
export const TEMPERATURE_MAX = 1200;
/** Druckregler in Zehnerpotenzen: 1 mbar bis 300 bar */
export const PRESSURE_LOG_MIN = -3;
export const PRESSURE_LOG_MAX = Math.log10(300);

export const CATALYSES: Array<{ id: WorkbenchConditions['catalysis']; label: string; icon: string; hint: string }> = [
  { id: 'keine', label: 'Ohne Katalysator', icon: '○', hint: 'Nichts zusetzen' },
  { id: 'sauer', label: 'Säurekatalysiert (H⁺)', icon: '🟥', hint: 'Einige Tropfen konzentrierte Schwefelsäure oder p-Toluolsulfonsäure' },
  { id: 'basisch', label: 'Basenkatalysiert (OH⁻)', icon: '🟦', hint: 'Natronlauge, Alkoholat oder eine Aminbase' },
  { id: 'metall', label: 'Metallkatalysator', icon: '⬡', hint: 'Palladium, Platin oder Nickel' },
  { id: 'lewis', label: 'Lewis-Säure', icon: '◆', hint: 'Aluminiumchlorid oder Eisen(III)-bromid' },
];

/** Temperatur auf den Reglerbereich begrenzen (ganze Grad). */
export function clampTemperature(value: number): number {
  return Math.max(TEMPERATURE_MIN, Math.min(TEMPERATURE_MAX, Math.round(value)));
}

/** Druck auf den Reglerbereich begrenzen (drei gültige Stellen). */
export function clampPressure(value: number): number {
  return Number(Math.max(10 ** PRESSURE_LOG_MIN, Math.min(300, value)).toPrecision(3));
}

/** Temperaturregler mit Schieber, Zahlenfeld und Schnellwahl. */
export function TemperatureControl({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  return (
    <>
      <h3 style={{ marginTop: 16 }}>
        <label htmlFor={id}>Temperatur</label>
      </h3>
      <div className="regler">
        <input
          id={id}
          type="range"
          min={TEMPERATURE_MIN}
          max={TEMPERATURE_MAX}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={formatTemperature(value)}
        />
        <div className="regler-wert">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={TEMPERATURE_MIN}
            max={TEMPERATURE_MAX}
            value={value}
            aria-label="Temperatur in Grad Celsius"
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span>°C</span>
        </div>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {TEMPERATURE_PRESETS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={`chip chip-small${value === entry.value ? ' active' : ''}`}
            onClick={() => onChange(entry.value)}
          >
            <span aria-hidden="true">{entry.icon}</span> {entry.label} {formatTemperature(entry.value)}
          </button>
        ))}
      </div>
    </>
  );
}

/** Druckregler (logarithmisch) mit Zahlenfeld und Schnellwahl. */
export function PressureControl({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  return (
    <>
      <h3 style={{ marginTop: 14 }}>
        <label htmlFor={id}>Druck</label>
      </h3>
      <div className="regler">
        <input
          id={id}
          type="range"
          min={PRESSURE_LOG_MIN}
          max={PRESSURE_LOG_MAX}
          step={0.01}
          value={Math.log10(value)}
          onChange={(event) => onChange(10 ** Number(event.target.value))}
          aria-valuetext={formatPressure(value)}
        />
        <div className="regler-wert">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min={0.001}
            max={300}
            step="any"
            value={value}
            aria-label="Druck in bar"
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span>bar</span>
        </div>
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {PRESSURE_PRESETS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={`chip chip-small${Math.abs(value - entry.value) < entry.value * 0.02 ? ' active' : ''}`}
            onClick={() => onChange(entry.value)}
          >
            {entry.label} {formatPressure(entry.value)}
          </button>
        ))}
      </div>
    </>
  );
}

/** Katalyse-Auswahl der Werkbank (Säure, Base, Metall, Lewis-Säure). */
export function CatalysisControl({ value, onChange }: { value: WorkbenchConditions['catalysis']; onChange: (value: WorkbenchConditions['catalysis']) => void }) {
  return (
    <>
      <h3 style={{ marginTop: 14 }}>Katalyse</h3>
      <div className="row" role="radiogroup" aria-label="Katalyse">
        {CATALYSES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={value === entry.id}
            className={`chip${value === entry.id ? ' active' : ''}`}
            title={entry.hint}
            onClick={() => onChange(entry.id)}
          >
            <span aria-hidden="true">{entry.icon}</span> {entry.label}
          </button>
        ))}
      </div>
    </>
  );
}
