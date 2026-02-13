/* HOOK PARA GESTIONAR LAS PREFERENCIAS DEL USUARIO (unidades y tema)  */

import { useState, useEffect, useCallback } from 'react';

/* Tipos para unidades y tema */
export type UnitSystem = 'metric' | 'imperial';
export type Theme = 'light' | 'dark';

/* Estructura de configuración */
interface Settings {
    units: UnitSystem;
    theme: Theme;
}

/* Interfaz del hook que retorna métodos y estado */
interface UseSettingsReturn extends Settings {
    setUnits: (units: UnitSystem) => void;
    setTheme: (theme: Theme) => void;
    toggleUnits: () => void;
    toggleTheme: () => void;
}

/* Clave para localStorage */
const STORAGE_KEY = 'weather-app-settings';

/* Configuración por defecto */
const defaultSettings: Settings = {
    units: 'metric',
    theme: 'light',
};


/* Hook para gestionar las preferencias del usuario con persistencia en localStorage */
export function useSettings(): UseSettingsReturn {

    /* Estado de configuración, inicializa desde localStorage si existe */
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Error al cargar configuración:', e);
        }
        return defaultSettings;
    });

    /* Guarda la configuración en localStorage cuando cambia de sitio buscado */
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Error al guardar configuración:', e);
        }
    }, [settings]);

    /* Aplica el tema al documento cuando cambia */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    /* Cambia las unidades */
    const setUnits = useCallback((units: UnitSystem) => {
        setSettings((prev) => ({ ...prev, units }));
    }, []);

    /* Cambia el tema */
    const setTheme = useCallback((theme: Theme) => {
        setSettings((prev) => ({ ...prev, theme }));
    }, []);

    /* Alterna entre unidades métricas e imperiales */
    const toggleUnits = useCallback(() => {
        setSettings((prev) => ({
            ...prev,
            units: prev.units === 'metric' ? 'imperial' : 'metric',
        }));
    }, []);

    /* Alterna entre tema claro y oscuro */
    const toggleTheme = useCallback(() => {
        setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'light' ? 'dark' : 'light',
        }));
    }, []);

    /* Devuelve el estado y los métodos */
    return {
        ...settings,
        setUnits,
        setTheme,
        toggleUnits,
        toggleTheme,
    };
}
