/* COMPONENTE QUE MUESTRA LA INFORMACIÓN DEL CLIMA DE UNA CIUDAD */
import type { UnitSystem } from '../hooks/useSettings';
import {
    formatTime,
    getWindDirection,
    explainFeelsLike,
} from '../utils/weatherUtils';
import '../styles/App.css';

export interface WeatherData {
    nombre: string;
    pais: string;
    temperatura: number;
    tempMax: number;
    tempMin: number;
    sensacionTermica: number;
    humedad: number;
    descripcion: string;
    icono: string;
    tipo: string;
    vientoVelocidad: number;
    vientoDireccion: number;
    amanecer: number;
    atardecer: number;
    actualizadoEn: number;
    lluvia?: number;
    nieve?: number;
    timezone: number;
}

/* Estructura de los datos del clima que recibe el componente */
interface WeatherCardProps {
    data: WeatherData;
    units: UnitSystem;
}

/* Componente principal que muestra todos los datos del clima */
export function WeatherCard({ data, units }: WeatherCardProps) {
    const tempSymbol = units === 'metric' ? '°C' : '°F';
    const speedUnit = units === 'metric' ? 'm/s' : 'mph';

    const displayTemp = (temp: number) => Math.round(temp);

    // Función para obtener la hora local ACTUAL de la ciudad
    const getLocalTime = (timezoneOffset: number): string => {

        // Usamos Date.now() para la hora actual
        const nowUtcSeconds = Math.floor(Date.now() / 1000);
        const localDate = new Date((nowUtcSeconds + timezoneOffset) * 1000);

        // Usamos getUTC para evitar doble aplicación de timezone
        const hours = localDate.getUTCHours().toString().padStart(2, '0');
        const minutes = localDate.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    return (

        <div className="weather-card">

            {/* Cabecera con ubicación */}
            <div className="weather-header">
                <h2 className="location">
                    📍 {data.nombre}, {data.pais}
                </h2>
            </div>

            {/* Indica la hora del sitio del que se busco el tiempo */}
            <div className="weather-header-info">
                <span className="local-time">
                    🕒 {getLocalTime(data.timezone)}
                </span>
            </div>

            {/* Temperatura principal, con un easter egg de Silent Hill si hay nievla o bruma */}
            <div className="weather-main">
                <img
                    src={`https://openweathermap.org/img/wn/${data.icono}@4x.png`}
                    alt={data.descripcion}
                    className="weather-icon"
                />
                <div className="temp-container">
                    <span className="temp-current">
                        {displayTemp(data.temperatura)}{tempSymbol}
                    </span>

                    <span className="temp-description">
                        {data.descripcion}
                        {(data.descripcion.toLowerCase().includes('niebla') ||
                            data.descripcion.toLowerCase().includes('bruma')) && (
                            <span className="silent-hill-text"> (¿Silent Hill?)</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Temperatura máxima y mínima */}
            <div className="temp-range">
                <span className="temp-max">
                    Temperatura máx. 🔼 {data.tempMax.toFixed(1)}{tempSymbol}
                </span>
                <span className="temp-min">
                    Temperatura mín. 🔽 {data.tempMin.toFixed(1)}{tempSymbol}
                </span>
            </div>

            {/* Sensación térmica */}
            <div className="feels-like">
                <span className="feels-like-value">
                    🧥 Sensación: {displayTemp(data.sensacionTermica)}{tempSymbol}
                </span>
                <span className="feels-like-explanation">
                    {explainFeelsLike(
                        data.temperatura,
                        data.sensacionTermica,
                        data.vientoVelocidad,
                        data.humedad
                    )}
                </span>
            </div>

            {/* Indica la humedad, el viento, o la hora en la que se amanece y atardece en el sitio buscado */}
            <div className="weather-details">
                <div className="detail-item">
                    <span className="detail-icon">💧</span>
                    <span className="detail-label">Humedad</span>
                    <span className="detail-value">{data.humedad}%</span>
                </div>

                <div className="detail-item">
                    <span className="detail-icon">🌬️</span>
                    <span className="detail-label">Viento</span>
                    <span className="detail-value">
                        {data.vientoVelocidad.toFixed(1)} {speedUnit} {getWindDirection(data.vientoDireccion)}
                    </span>
                </div>

                <div className="detail-item">
                    <span className="detail-icon">🌅</span>
                    <span className="detail-label">Amanecer</span>
                    <span className="detail-value">{formatTime(data.amanecer)}</span>
                </div>

                <div className="detail-item">
                    <span className="detail-icon">🌇</span>
                    <span className="detail-label">Atardecer</span>
                    <span className="detail-value">{formatTime(data.atardecer)}</span>
                </div>
            </div>

            {/* Precipitación (si hay) */}
            {(data.lluvia || data.nieve) && (
                <div className="precipitation">
                    {data.lluvia && (
                        <span className="precip-item">🌧️ Lluvia: {data.lluvia} mm/h</span>
                    )}
                    {data.nieve && (
                        <span className="precip-item">❄️ Nieve: {data.nieve} mm/h</span>
                    )}
                </div>
            )}
        </div>
    );
}
