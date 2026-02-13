/* COMPONENTE DE CONFIGURACIÓN PARA PREFERENCIAS DEL USUARIO (unidades) */
import type { UnitSystem } from '../hooks/useSettings';
import '../styles/App.css';


/* Props del componente: unidades y función para alternar */
interface SettingsProps {
    units: UnitSystem;
    onToggleUnits: () => void;
}


/* Componente de configuración con toggles para unidades */
export function Settings({
    units,
    onToggleUnits,
}: SettingsProps) {
    /* Renderiza el botón para cambiar entre Celsius y Fahrenheit */
    return (
        <div className="settings">
            <button
                className="settings-btn"
                onClick={onToggleUnits}
                title={units === 'metric' ? 'Cambiar a Fahrenheit' : 'Cambiar a Celsius'}
            >
                {units === 'metric' ? '°F' : '°C'}
            </button>
        </div>
    );
}
